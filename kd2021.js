
var KD_ALL = ".*";
var KD_ID = 0;


/** Base class of Kicsy obects */
class KDObject {
    constructor(properties) {

        this.getId = function () { this.id = "KD_" + (++KD_ID); }
        this.getId();

        //Check properties nullity
        if (properties == undefined) properties = {};

        //process each property
        for (var p in properties) {
            this[p] = properties[p];
        }


        // This is an assign function that copies full descriptors
        this.completeAssign = function completeAssign(target, ...sources) {
            sources.forEach(source => {
                let descriptors = Object.keys(source).reduce((descriptors, key) => {
                    descriptors[key] = Object.getOwnPropertyDescriptor(source, key);
                    return descriptors;
                }, {});
                // by default, Object.assign copies enumerable Symbols too
                Object.getOwnPropertySymbols(source).forEach(sym => {
                    let descriptor = Object.getOwnPropertyDescriptor(source, sym);
                    if (descriptor.enumerable) {
                        descriptors[sym] = descriptor;
                    }
                });
                Object.defineProperties(target, descriptors);
            });
            return target;
        }

    }
}



/** Message class wrapper.
 * @param payload Data to be communicated
 * @param source Application wich generate message
 * @param destination Application identifier. If null KDMessaje assumes KD_ALL by default
  */
class KDMessage extends KDObject {
    constructor(payload, source, destination) {
        super();
        this.source = source;
        this.destination = destination == null ? KD_ALL : destination;
        this.payload = payload;
    }
}


/** KERNEL OF KD2021 API */
class KDKernel extends KDObject {

    constructor() {

        super();

        var applicationClasses = new Array(0);
        var applications = new Array(0);


        /** Add an application */
        this.addApplication = function (kdApplicationClass) {
            applicationClasses.push(kdApplicationClass);
        }

        /** Run all applications */
        this.run = function () {
            applicationClasses.forEach(function (appClass) {
                var app = new appClass(this);
                applications.push(app);
                app.initializing();

            });

        }

        /** Send messages to local registred applications */
        this.sendLocalMessage = function (kdMessage) {
            var re = new RegExp(kdMessage.destination);
            applications.forEach(function (app) {
                if (re.test(app.id))
                    app.process(kdMessage);
            });

        }


    }

}

/** Application base class */
class KDApplication extends KDObject {
    constructor(kdKernel) {

        super();

        /** Application identifier */
        this.id = "NewApp";

        /** Reference to kernel  */
        this.kernel = kdKernel;

        /** Initializing cycle life 
         * @param params any object to configure the application
        */
        this.initializing = function (params) { }

        /** Must be override in order to process messages
         * @param kdMessage object type KDMessage 
         */
        this.process = function (params) { }

    }


}


/** User class wrapper */
class KDUser {
    constructor() {
        this.id = "0";
        this.level = "0";
        this.name = "guess";

    }
}

/** Component base class */
class KDComponent extends KDObject {
    constructor(properties) {
        super(properties);

        var it = this;

        /** Send to body current KDs components */
        this.sendToBody = function () { document.getElementsByTagName("body")[0].appendChild(this.dom); return this; }

        /**  Set value at dom object. */
        this.setValue = function (value) { this.dom.value = value; return this; }

        /** Get value from dom value property */
        this.getValue = function () { return this.dom.value }

        /** Get an object with name and value properties */
        this.getObject = function () { var o = {}; o[this.name] = this.getValue(); return o }

        /** Set name field. Used with binder works */
        this.setName = function (name) { this.name = name; if (this.dom) { this.dom.name = name; } return this; }




        /**
         * Add an event handler to DOM. 
         * @param {String} eventType String wich represents event name like "click"
         * @param {Function} code Function with a parameter passing itself javascript object.
         * @returns itself
         */
        this.addEvent = function (eventType, code) {
            var comp = this;
            this.dom.addEventListener(eventType, function () { code(comp) });

            return this;
        }

        this.clone = function () {
            let obj = this.completeAssign({}, this);
            obj.getId();
            obj.dom = obj.dom.cloneNode(true);
            obj.dom.id = obj.id;
            /*
             for (let e of this.eventHandlers) {
                 obj.addEvent(e.eventType, e.code);
             }
             */
            return obj;
        }


        /** Manage onChange event on HTML subaycent object */
        this.setChangeHandler = function (code) { this.addEvent("change", code); return this }

        //Component name. It used to identify the component for binders works
        this.name = "";

        //Check html class
        if (this.htmlClass == null) { this.htmlClass = "div" }

        //Create DOM
        this.dom = document.createElement(this.htmlClass);
        this.dom.id = this.id;

        //Check some common properties
        if (this.value) this.dom.value = this.value;


    }
}

var KDDefaultGraphicUnit = "px";

/** Visual component class base */
class KDVisualComponent extends KDComponent {
    constructor(properties) {
        super(properties);

        if (this.type != undefined) {
            this.dom.setAttribute("type", this.type);
        }

        for (let s in this.style) {
            this.dom.style[s] = this.style[s];
        }


        this.suffixGraphicUnit = function (pixels) { return pixels + KDDefaultGraphicUnit }

        this.height = 20;
        this.width = 100;


        this.setHeight = function (value) {
            this.height = value;
            this.dom.style.height = this.suffixGraphicUnit(value);
            return this;
        }
        this.setWidth = function (value) {
            this.width = value;
            this.dom.style.width = this.suffixGraphicUnit(value);
            return this;
        }

        this.setTop = function (value) {
            this.dom.style.top = this.suffixGraphicUnit(value);
            return this;
        }

        this.setLeft = function (value) {
            this.dom.style.left = this.suffixGraphicUnit(value);
            return this;
        }


    }
}


/** Components with inner components */
class KDVisualContainerComponent extends KDVisualComponent {
    constructor(properties) {
        super(properties);
        this.components = [];

        this.wrap = function () {
            for (let obj of arguments) {
                if (Array.isArray(obj)) {
                    for (let o of obj) {
                        this.dom.appendChild(o.dom);
                        this.components.push(o);
                    }
                } else {
                    this.dom.appendChild(obj.dom);
                    this.components.push(obj);
                }
            }
            return this;
        }


        this.clone = function () {
            let obj = this.completeAssign({}, this);
            obj.dom = obj.dom.cloneNode(false);
            obj.getId();
            obj.dom.id = obj.id;
            obj.components = [];
            for (let comp of this.components) {
                obj.wrap(comp.clone());
            }
            return obj;
        }


        /**
         * Clear a node in specific position or all children if position==undefined
         * @param {Int} position 
         */
        this.clear = function (position) {
            if (position == undefined) {
                this.components = [];
                this.dom.innerHTML = "";
            } else {
                this.components.splice(position, 1);
                this.dom.childNodes[position].remove();
            }
        }
    }
}






/**
 * This function join properties from objects passed as arguments
 * @param {*} Object Object will be joined. 
 * @returns object with all properties. Last objects will override first objects properties on result object.
 */
function KDJoiner(objects) {
    var r = {}
    for (let o of arguments) {
        for (let p in o) {
            r[p] = o[p];
        }
    }
    return r;
}


/** 
 * Return a object with style object inside and styles properties passed through
 * Example: KDButton(KDStyler({"backgroundColor":"red", "margin", "2px"}))
 */
function KDStyler(args) {
    var r = {};
    for (let p of arguments) {
        for (let n of Object.keys(p)) {
            r[n] = p[n];
        }
    }
    var z = {}
    z.style = r;
    return z;
}


/**
 * Function wich return a KDVisualContainerComponent object with DIV dom for populate with other KDs components
 * @param {*} properties 
 * @returns A KDVisualContainerComponent with DIV style.
 */
function KDLayer(properties) {
    if (properties == undefined) properties = {};
    properties.htmlClass = "div";
    var vcc = new KDVisualContainerComponent(properties);
    vcc.setValue = function (value) { vcc.dom.innerHTML = value; return vcc }
    return vcc;
}


function KDBinder(properties) {
    var vcc = KDLayer(properties);
    vcc.data = {}
    vcc.onDataChanged = function (object) { }

    /** 
     * Assign a function with an only parameter data to retrieve changes when user modify data
     * Example:
     * .setOnDataChanged(function(obj){alert(JSON.stringify(obj))})
     * */
    vcc.setOnDataChanged = function (code) { vcc.onDataChanged = code; return vcc }

    /**
     * Bind KDBinder with all its children components. Is recursive (with others inner KDBinder)
     * @param {*} data 
     * @returns 
     */
    vcc.bind = function (data, binder) {
        if (data != undefined) vcc.data = data;
        if (binder == undefined) binder = vcc;
        for (let c of vcc.components) {
            //Setting values from initial data
            if (binder.data[c.name] != undefined) {
                console.log(c.id);
                c.setValue(binder.data[c.name])
                // bind on change event
                c.dom.addEventListener("change", function () {
                    binder.data[c.name] = c.getValue();
                    binder.onDataChanged(binder.data);
                });
            }
            // Bind children
            if (c.bind != undefined) {
                c.bind(binder.data, binder);
            }
        }
        return vcc;
    }

    vcc.setValues = function (data, binder) {
        if (binder == undefined) binder = vcc;
        for (let c of vcc.components) {
            //Setting values from initial data
            if (binder.data[c.name] != undefined) {
                c.setValue(binder.data[c.name])
            }

            if (c.bind != undefined) {
                c.setValue(binder.data, binder);
            }
        }
    }

    vcc.clone = function () {
        let vcc2 = KDBinder(properties);
        for (c of vcc.components) {
            vcc2.wrap(c.clone())
        }
        return vcc2;
    }

    return vcc;
}


class KDServerBridge extends KDObject {
    constructor(url, data, success_callback, error_callback, method, mimeType) {
        super();
        this.url = url;
        this.success_callback = success_callback;
        this.error_callback = error_callback;
        this.method = method;
        this.mimeType = mimeType;
        this.data = data;


        this.send = function () {
            //Get method
            if (this.method == undefined) this.method = "post";

            // Define mime
            if (this.mimeType == undefined) this.mimeType = 'text/xml';

            //Define callback
            if (this.success_callback == undefined) this.success_callback = function (msg) { alert(msg); }
            if (this.error_callback == undefined) this.error_callback = function (msg) { alert(msg); }

            //Create request
            var http_request = new XMLHttpRequest();
            http_request.overrideMimeType(this.mimeType);

            var ref = this;
            //Manage request
            http_request.onreadystatechange = function () {
                if (http_request.readyState == 4) {
                    if (http_request.status == 200) {
                        ref.success_callback(http_request.responseText);
                    } else {
                        ref.error_callback("ERROR loading data from " + url);
                        console.log("ERROR loading data from " + url);
                    }
                }
            };

            http_request.open(this.method, this.url, true);
            http_request.send(this.data);

        }
    }
}

function KDJsonAdapter(properties) {
    var layer = KDLayer(properties);
    layer.binder = {};
    layer.arrayData = [];

    /** Set associated KDBinder */
    layer.wrapBinder = function (binder) { layer.binder = binder; /* layer.wrap(binder); */ return layer; }

    /** Load data from an URL and invoke createList method */
    layer.load = function (url, method, success_callback, error_callback,) {
        var bridge = new KDServerBridge(url, "", function (response) {
            var arrayData = JSON.parse(response);
            if (!Array.isArray(arrayData)) {
                arrayData = [arrayData];
            }
            layer.arrayData = arrayData;
            layer.createList();
            if (success_callback != undefined) success_callback();
        }, error_callback, method);
        bridge.send();
        return layer;
    }


    /**
     * Send a request to server in order to save informatio
     * @param {URL} url scrit to be executed
     * @param {function(msg)} success_callback callback invoke when successful operation
     * @param {function(msg)} error_callback {} callback invoke when error operation result.
     * @param {int} position Position of row to save. Put undefined to save all data.
     * @param {String} method Request methos: GET, POST, etc.
     * @returns itself reference
     */
    layer.save = function (url, success_callback, error_callback, position, method) {

        //Encoding data:
        var postData = [];
        if (position == undefined) {
            postData = JSON.stringify(layer.arrayData);
        } else {
            postData = JSON.stringify(layer.arrayData[position]);
        }
        postData = window.btoa(postData);
        console.log(postData);

        //Formatting data
        var formData = new FormData();
        formData.append("arrayData", postData);

        //Sending data:
        var bridge = new KDServerBridge(url, formData, success_callback, error_callback, method);
        bridge.send();

        return layer;
    }

    /**
     * Create a new record on database
     * @param {string} insertUrl sql insert string
     * @param {*} selectUrl sql select stametement string
     * @param {*} formData data to be sended (Using FormData)
     * @param {*} success_callback Callbacks when successfull
     * @param {*} error_callback Callback when error
     * @param {*} method Url method: POST, GET, etc.
     * @returns 
     */
    layer.newRecord = function (insertUrl, selectUrl, formData, success_callback, error_callback, method) {
        var bridge = new KDServerBridge(insertUrl, formData, success_callback, error_callback, method);
        bridge.success_callback = function () {
            layer.load(selectUrl, method);
            success_callback();
        }
        bridge.send();

        return layer;

    }


    layer.insertRecord = function () {
        let newBinder = layer.binder.clone();
        layer.wrap(newBinder);
        return layer;
    }

    layer.createList = function () {
        layer.clear();

        for (let i = 0; i < layer.arrayData.length; i++) {
            layer.insertRecord();
        }

        for (let i = 0; i < layer.arrayData.length; i++) {
            let record = layer.arrayData[i];
            let binder = layer.components[i];
            binder.bind(record, binder);
        }

        return layer;
    }

    layer.getData = function () {
        var r = [];
        for (let b of layer.components) {
            r.push(b.data);
        }
        layer.arrayData = r;
        return r;
    }

    return layer;
}


/** Function return a Button  */
function KDButton(properties) {
    if (properties == undefined) properties = {};
    properties.htmlClass = "input";
    properties.type = "button";
    return new KDVisualComponent(properties);
}

/**
 * Function wich return a simple text input field
 * @param {*} properties 
 * @returns 
 */
function KDTextField(properties) {
    if (properties == undefined) properties = {};
    properties.htmlClass = "input";
    properties.type = "text";
    return new KDVisualComponent(properties);
}


function KDImage(properties) {
    if (properties == undefined) properties = {};
    properties.htmlClass = "img";
    var vc = new KDVisualComponent(properties);
    vc.setImageUrl = function (url) { this.dom.src = url; return this }
    vc.setValue = vc.setImageUrl;
    return vc;
}


/*********** */
class Alive extends KDApplication {
    constructor() {
        super();

        this.id = "Alive";
        this.process = function (kdMessage) {
            var s = kdMessage.payload + " from " + kdMessage.source + " to " + kdMessage.destination;
            alert(s);
        };
    }
}


