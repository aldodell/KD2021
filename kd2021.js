"use strict";
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

        this.toBase64 = function (str) {
            return window.btoa(encodeURIComponent(str));
        }

        this.fromBase64 = function (bin) {
            return decodeURIComponent(window.atob(bin));
        }

        this.storeIn = function (variableName) {
            window[variableName] = this;
            return this;
        }

        /**
         * Use to import all properties from kdObject to this object.
         * @param {*} kdObject 
         */
        this.apply = function (kdObject) {
            this.appliedObject = kdObject;
            this.appliedObject();
        }

        this.showProperties = function () {
            var r = "";
            for (let p in this) {
                r = r + p + "\n";
            }
            return r;
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
        this.name = this.id;

        /** Send to body current KDs components */
        this.sendToBody = function () { document.getElementsByTagName("body")[0].appendChild(this.dom); return this; }

        this.value = {}

        /**  Set value at dom object. */
        this.setValue = function (value) {
            this.value = value;
            this.dom.value = value;
            return this;
        }

        /** Get value from dom value property */
        this.getValue = function () {
            this.value = this.dom.value;
            return this.value;
        }

        /** Get an object with name and value properties */
        this.getObject = function () { var o = {}; o[this.name] = this.getValue(); return o }

        /** Set name field. Used with binder works */
        this.setName = function (name) { this.name = name; if (this.dom) { this.dom.name = name; } return this; }

        /**
         * 
         */
        this.eventHandlers = [];

        /**
         * Add an event handler to DOM. 
         * @param {String} eventType String wich represents event name like "click"
         * @param {Function} callback Function with a parameter passing itself javascript object.
         * @returns itself
         */
        this.addEvent = function (eventType, callback) {
            var comp = this;
            this.dom.addEventListener(eventType, function () { callback(comp) });
            this.eventHandlers.push({ "eventType": eventType, "callback": callback })
            return this;
        }

        /**
         * Add an event handler to DOM. But directly attached. Is exactly like addEventListener
         * @param {*} eventType 
         * @param {*} callback 
         * @returns 
         */
        this.addEventDirectly = function (eventType, callback) {
            var comp = this;
            this.dom.addEventListener(eventType, callback);
            this.eventHandlers.push({ "eventType": eventType, "callback": callback })
            return this;
        }


        this.clone = function () {
            let obj = this.completeAssign({}, this);
            obj.getId();
            obj.dom = obj.dom.cloneNode(true);
            obj.dom.id = obj.id;

            for (let e of obj.eventHandlers) {
                let et = e.eventType;
                let cb = e.callback;
                obj.dom.addEventListener(et, function () { cb(obj) });
            }

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

var kdDefaultGraphicUnit = "px";

/** Visual component class base */
class KDVisualComponent extends KDComponent {
    constructor(properties) {
        super(properties);

        this.height = 20;
        this.width = 100;


        if (this.type != undefined) {
            this.dom.setAttribute("type", this.type);
        }

        for (let s in this.style) {
            this.dom.style[s] = this.style[s];
        }


        this.suffixGraphicUnit = function (size) {
            return isNaN(size) ? size : size + kdDefaultGraphicUnit;
        }



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

        this.getWidth = function () {
            return this.dom.offsetWidth;
        }

        this.getHeight = function () {
            return this.dom.offsetHeight;
        }


        this.setTop = function (value) {
            this.dom.style.top = this.suffixGraphicUnit(value);
            return this;
        }

        this.setLeft = function (value) {
            this.dom.style.left = this.suffixGraphicUnit(value);
            return this;
        }

        this.setEnabled = function (boolValue) { this.dom.disabled = !boolValue; return this; }

        this.setHint = function (text) { this.dom.placeholder = text; return this; }
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


        /**
         * Return a component with same properties from parent
         * @returns KDComponent
         */
        this.clone = function () {
            let obj = this.completeAssign({}, this);
            obj.dom = obj.dom.cloneNode(false);
            obj.getId();
            obj.dom.id = obj.id;
            obj.components = [];
            for (let comp of this.components) {
                obj.wrap(comp.clone());
            }
            obj.setValue(this.getValue());
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
            return this;
        }
    }
}






/**
 * This function join properties from objects passed as arguments
 * @param {*} Object Object will be joined. 
 * @returns object with all properties. Last objects will override first objects properties on result object.
 */
function kdJoiner(objects) {
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
 * Example: kdButton(kdStyler({"backgroundColor":"red", "margin", "2px"}))
 */
function kdStyler(args) {
    var r = {};
    for (let p of arguments) {

        //Verificamos primero si el argumento pasado es otro styler:
        if (p.style == undefined) {
            for (let n of Object.keys(p)) {
                r[n] = p[n];
            }
        } else {
            for (let n of Object.keys(p.style)) {
                r[n] = p.style[n];
            }
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
function kdLayer(properties) {
    if (properties == undefined) properties = {};
    properties.htmlClass = "div";

    var vcc = new KDVisualContainerComponent(properties);


    vcc.setValue = function (value) {
        vcc.value = value;
        vcc.dom.innerHTML = value;
        return vcc;
    }

    vcc.getValue = function () {
        return vcc.dom.innerHTML;
    }

    vcc.setText = function (text) {
        vcc.dom.innerText = text;
        return vcc;
    }


    return vcc;
}


function kdBinder(properties) {
    var vcc = kdLayer(properties);
    vcc.data = {}
    vcc.onDataChanged = function (object) { }

    /** 
     * Assign a function with an only parameter data to retrieve changes when user modify data
     * Example:
     * .setOnDataChanged(function(obj){alert(JSON.stringify(obj))})
     * */
    vcc.setOnDataChanged = function (code) { vcc.onDataChanged = code; return vcc }

    /**
     * Bind kdBinder with all its children components. Is recursive (with others inner kdBinder)
     * @param {*} data 
     * @returns 
     */
    vcc.bind = function (data, binder) {
        if (data != undefined) vcc.data = data;
        if (binder == undefined) binder = vcc;
        for (let c of vcc.components) {
            // set a reference for data row on each component
            c.data = data;

            //Setting values from initial data
            if (binder.data[c.name] != undefined) {
                //console.log(c.id);
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
        let vcc2 = kdBinder(properties);
        for (let c of vcc.components) {
            vcc2.wrap(c.clone())
        }
        return vcc2;
    }


    /**
     * Return a value from component whith name = fieldValueName
     * if filter condition is true.
     * "filter" parameter is a function with an internal parameter
     * representing the component to evaluate.
     * 
     * Example:
     * var v = binder.getConditionalValue(function(c){c.name="field"}, "id")
     * 
     * @param {function(component){}} filter 
     * @param {string} fieldValueName 
     * @returns 
     */
    vcc.getFilteredValue = function (fieldValueName, filter) {
        var theValue = null;
        var condition = false;

        if (filter == undefined) {
            filter = function (o) { let v = o.getValue(); return v.toString() == "true" ? true : false; }
        }

        for (let c of vcc.components) {
            if (c.name == fieldValueName) {
                theValue = c.getValue();
            }
            if (!condition) {
                if (filter(c)) {
                    condition = true;
                }
            }
        }
        if (condition) {
            return theValue;
        } else {
            return null;
        }
    }


    vcc.clear = function () { vcc.data = {}; return vcc; }

    /**
     * Set directly a pair key/value on KDBinder data property 
     * @param {*} key 
     * @param {*} value 
     */
    vcc.setDataEntry = function (key, value) {
        vcc.data[key] = value;
        return vcc;
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
            if (this.success_callback == undefined) this.success_callback = function (msg) { }
            if (this.error_callback == undefined) this.error_callback = function (msg) { }

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

/**
 * Return a FormData object joining all FromData passed as arguments
 * @param {[FromData]} data 
 * @returns FormData
 */
function kdDataJoiner(data) {
    var r = new FormData();
    for (let d of arguments) {
        for (let p of d.entries()) {
            r.append(p[0], p[1]);
        }
    }
    return r;
}

/**
 * Function wich return a FormData object, but have a modified "append" method which could be chained
 * Allways use .formData method as final chain secuence like:
 * var fd = kdFormData().append("a",1).append("b",2).formData();
 * @param {*} formData 
 * @returns FormData
 */
function kdFormData(formData) {
    var obj = {};
    obj.data = [];

    obj.append = function (key, value) {
        var e = { key: value }
        this.data.push(e);
        return this;
    }

    obj.formData = function () {
        var fd = new FormData();
        for (let e of this.data) {
            fd.append(e.key, e.value);
        }
        return fd;
    }

    return obj;
}



function kdJsonAdapter(properties) {
    var layer = kdLayer(properties);
    layer.binder = {};
    layer.data = [];
    layer.extraData = new FormData();

    /**
  * 
  * @returns Clear extra data
  */
    layer.clearExtraData = function () {
        layer.extraData = new FormData();
        return layer;
    }

    /**
     * 
     * @param {*} key 
     * @param {*} value 
     * @returns 
     */
    layer.appendExtraData = function (key, value) {
        layer.extraData.append(key, value);
        return layer;
    }


    /** Set associated kdBinder */
    layer.wrapBinder = function (binder) {
        layer.data = [];
        layer.binder = binder;
        return layer;
    }

    /**
     * Load data from an URL and invoke createList method
     * @param {*} url 
     * @param {*} method 
     * @param {*} success_callback 
     * @param {*} error_callback 
     * @returns 
     */
    layer.load = function (url, method, success_callback, error_callback,) {
        var bridge = new KDServerBridge(url, layer.extraData, function (response) {
            var data = JSON.parse(response);
            if (!Array.isArray(data)) {
                data = [data];
            }
            layer.data = data;
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
            postData = JSON.stringify(layer.data);
        } else {
            postData = JSON.stringify(layer.data[position]);
        }
        // postData = window.btoa(postData);
        postData = layer.toBase64(postData);

        //Formatting data
        var formData = new FormData();
        formData.append("data", postData);
        formData = kdDataJoiner(layer.extraData, formData);

        //Sending data:
        var bridge = new KDServerBridge(url, formData, success_callback, error_callback, method);
        bridge.send();

        return layer;
    }

    /**
     * Use to send request directly to server, like deletes or inserts operations.
     * Example:
     * var ids = [1,3,5,7];
     * adapter.send("url.domain.com", ids);
     * @param {*} url 
     * @param {*} values 
     * @param {*} success_callback 
     * @param {*} error_callback 
     * @param {*} method 
     */
    layer.send = function (url, values, success_callback, error_callback, method, dataLabel) {
        //Checking data
        if (dataLabel == undefined) dataLabel = "data";
        if (values == undefined) values = "";

        //Formatting data
        var formData = new FormData();
        formData.append("data", values);
        formData = kdDataJoiner(layer.extraData, formData);

        //Sending data:
        var bridge = new KDServerBridge(url, formData, success_callback, error_callback, method);
        bridge.send();
    }



    layer.insertRecord = function () {
        let newBinder = layer.binder.clone();
        layer.wrap(newBinder);
        newBinder.dom.scrollIntoView();
        return layer;
    }

    layer.createList = function () {
        layer.clear();

        for (let i = 0; i < layer.data.length; i++) {
            layer.insertRecord();
        }

        for (let i = 0; i < layer.data.length; i++) {
            let record = layer.data[i];
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
        layer.data = r;
        return r;
    }

    layer.getFilteredValues = function (fieldValueName, filter) {
        var r = [];
        for (let binder of layer.components) {
            let v = binder.getFilteredValue(fieldValueName, filter);
            if (v != null) {
                r.push(v);
            }
        }
        return r;
    }
    return layer;
}


/** Function return a Button  */
function kdButton(properties) {
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
function kdTextField(properties) {
    if (properties == undefined) properties = {};
    properties.htmlClass = "input";
    properties.type = "text";
    return new KDVisualComponent(properties);
}


function kdImage(properties) {
    if (properties == undefined) properties = {};
    properties.htmlClass = "img";
    var vc = new KDVisualComponent(properties);
    vc.setImageUrl = function (url) { this.dom.src = url; return this }
    vc.setValue = vc.setImageUrl;
    return vc;
}

function kdCheckBox(properties) {
    if (properties == undefined) properties = {};
    properties.htmlClass = "input";
    properties.type = "checkbox";
    var vc = new KDVisualComponent(properties);
    vc.getValue = function () { return this.dom.checked }
    vc.setValue = function (status) { this.dom.checked = status; return vc; }
    return vc;

}

function kdSpan(properties) {
    if (properties == undefined) properties = {};
    properties.htmlClass = "span";
    var vcc = new KDVisualContainerComponent(properties);
    vcc.setValue = function (value) {
        vcc.dom.textContent = value;
        return vcc;
    }
    return vcc;

}

function kdVerticalScroll(properties) {
    var layer = kdLayer(properties);
    layer.dom.style.overflowY = "scroll";
    return layer;

}

function kdLabel(properties) {
    if (properties == undefined) properties = {};
    properties.htmlClass = "label";
    var vc = new KDVisualComponent(properties);
    vc.setValue = function (value) {
        vc.value = value;
        vc.dom.appendChild(vc.dom.ownerDocument.createTextNode(value));
        return vc;
    }
    return vc;

}

/**
 * Layer used for send files to server.
 * Call .active method is madatory
 * @param {} properties 
 * @returns 
 */
function kdDropFileZone(properties) {
    var layer = kdLayer(properties);

    function preventDefault(ev, layer, style) {
        ev.preventDefault();
        if (style != undefined) { layer.apply(style); }
    }

    layer.dragEnterStyle = undefined;
    layer.dragLeaveStyle = undefined;
    layer.dragOverStyle = undefined;

    layer.setDragEnterStyle = function (style) { layer.dragEnterStyle = style; return this }
    layer.setDragLeaveStyle = function (style) { layer.dragLeaveStyle = style; return this }
    layer.setDragOverStyle = function (style) { layer.dragOverStyle = style; return this }


    /**
     * Method to make active the Drope File Zone
     * @param {*} url 
     * @param {*} extraFormData Data within FormData object
     * @param {*} progress_callback Method with this sign: callback(i, files length)
     * @param {*} success_callback 
     * @param {*} error_callback 
     * @param {*} method 
     * @param {*} mimeType 
     * @returns 
     */
    layer.active = function (url, extraFormData, progress_callback, success_callback, error_callback, method, mimeType) {
        if (progress_callback == undefined) progress_callback = function (progress, quantity) { }
        layer.addEventDirectly("dragenter", preventDefault, layer.dragEnterStyle);
        layer.addEventDirectly("dragover", preventDefault, layer.dragOverStyle);
        layer.addEventDirectly("dragleave", preventDefault, layer.dragLeaveStyle);

        if (success_callback == undefined) success_callback = function (m) { }
        if (error_callback == undefined) error_callback = function (m) { }

        layer.addEventDirectly("drop", function (ev) {
            ev.preventDefault();
            let dt = ev.dataTransfer;
            let files = dt.files;
            let filesAr = [...files];
            var i = 0;
            filesAr.forEach(
                file => {
                    let data = new FormData();
                    data.append("file", file);
                    if (extraFormData != undefined) data = kdDataJoiner(extraFormData, data);
                    let bridge = new KDServerBridge(url, data, function (m) { progress_callback(i, filesAr.length); success_callback(m) }, error_callback, method, mimeType);
                    bridge.send();
                    i++;
                }
            )
        });
        return layer;
    }
    return layer;
}



/**
 * Class to manipulate local files
 */
class KDFile extends KDObject {
    constructor() {
        super();
        this.read = function (file, callback) {
            var rawFile = new XMLHttpRequest();
            rawFile.open("GET", file, false);
            rawFile.onreadystatechange = function () {
                if (rawFile.readyState === 4) {
                    if (rawFile.status === 200 || rawFile.status == 0) {
                        var allText = rawFile.responseText;
                        callback(allText);
                    }
                }
            }
            rawFile.send(null);
        }
    }
}

class KDApi extends KDObject {

    constructor() {
        super();
        var code = "";

        //Assign version
        this.version = 1.0;

        // Return code
        this.getCode = function (callback) {
            var f = new KDFile();
            f.read("kd2021.js", callback);
        }
    }
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


/****************************** */
/* CSS themes */

var kdStyleSimpleShadow = function () { return kdStyler({ "boxShadow": "4px 4px 4px gray" }); }
var kdStyleDisplayBlock = function () { return kdStyler({ "display": "block" }); }
var kdStyleDisplayInline = function () { return kdStyler({ "display": "inline" }); }
var kdStyleWidthPercent = function (value) {
    if (value == undefined) value = 100;
    var s = value + "%";
    console.log(s)
    return kdStyler({ "width": s })
}

/**
 * Return width with kdDefaultGraphicUnit
 * @param {*} value 
 * @returns 
 */
var kdStyleWidth = function (value) {
    if (value == undefined) value = 100;
    var s = value + kdDefaultGraphicUnit;
    console.log(s)
    return kdStyler({ "width": s })
}

var kdStyleBorder = function (size, color, style) {
    if (size == undefined) size = 1;
    if (!isNaN(size)) size = size + "px";
    if (color == undefined) color = "black";
    if (style == undefined) style = "solid";
    var s = size + " " + color + " " + style;
    console.log(s);
    return kdStyler({ "border": s })
}
var kdStyleCenterHorizontally = function () {
    return kdStyler({ "margin": "0 auto" });
}

var kdStyleMargin = function (all) {
    var s = all + kdDefaultGraphicUnit;
    console.log(s);
    return kdStyler({ "margin": s });
}


var kdStyleBackgroundColor = function (color) {
    return kdStyler({ "backgroundColor": color });
}

