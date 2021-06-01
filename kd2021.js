
var KD_ALL = ".*";


/** Base class of Kicsy obects */
class KDObject {
    constructor() {

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
        super();

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
        this.setName = function (name) { this.name = name; return this }

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


        /** Manage onChange event on HTML subaycent object */
        this.setChangeHandler = function (code) { this.addEvent("change", code); return this }

        //Component name. It used to identify the component for binders works
        this.name = "$0";

        //Check properties nullity
        if (properties == undefined) properties = {};

        //process each property
        for (var p in properties) {
            this[p] = properties[p];
        }


        //Check html class
        if (this.htmlClass == null) { this.htmlClass = "div" }

        //Create DOM
        this.dom = document.createElement(this.htmlClass);

        //Check some common properties
        if (this.value) this.dom.value = this.value;


    }
}

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

        this.px = function (pixels) { return pixels + "px" }

        var height = 20;
        var width = 100;
        var minHeight = 20;
        var minWidth = 100;
        var maxHeight = 20;
        var maxWidth = 100;
        var verticalSeparation = 2;
        var horizontalSeparation = 2;


        this.setHeight = function (value) {
            if (value > maxHeight) value = maxHeight;
            if (value < minHeight) value = minHeight;
            height = value;
            this.dom.style.height = this.px(value);
        }


        this.setWidth = function (value) {
            if (value > maxWidth) value = maxWidth;
            if (value < minWidth) value = minWidth;
            width = value;
            this.dom.style.width = this.px(value);
        }

        this.setTop = function (value) {
            this.dom.style.top = this.px(value);
        }

        this.setLeft = function (value) {
            this.dom.style.left = this.px(value);
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
                    for (let o in obj) {
                        this.dom.appendChild(o.dom);
                        this.components.push(o);
                    }
                } else {
                    this.dom.appendChild(obj.dom)
                    this.components.push(obj);
                }
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
    return new KDVisualContainerComponent(properties);

}


function KDBinder(properties) {
    if (properties == undefined) properties = {};
    properties.htmlClass = "div";
    var vcc = new KDVisualContainerComponent(properties);
    vcc.data = {}

    vcc.setValues = function (data) {
        vcc.data = data;
        for (let c of vcc.components) {
            if (data[c.name] != undefined) { c.setValue(data[c.name]) }
        }
        return vcc;
    }

    vcc.dataChanged = function (object) { }

    /** 
     * Assign a function with an only parameter data to retrieve changes when user modify data
     * Example:
     * .bind(function(obj){alert(JSON.stringify(obj))})
     * */
    vcc.bind = function (dataChangedCode) {
        for (let c of vcc.components) {
            c.setChangeHandler(function () {
                vcc.data[c.name] = c.getValue();
                vcc.dataChanged(vcc.data);
            });
        }
        vcc.dataChanged = dataChangedCode;
        return vcc;
    }
    return vcc;
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


