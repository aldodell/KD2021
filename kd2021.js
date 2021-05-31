
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
        this.getObject = function() {var o={}; o[this.name] = this.getValue(); return o}

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
        }


        this.setWidth = function (value) {
            if (value > maxWidth) value = maxWidth;
            if (value < minWidth) value = minWidth;
            width = value;
        }

        this.setTop = function (value) {
            this.dom.style.top = value + "px";
        }

        this.setLeft = function (value) {
            this.dom.style.left = value + "px";
        }


    }
}


/** Components with inner components */
class KDVisualContainerComponent extends KDVisualComponent {
    constructor(properties) {
        super(properties);
        this.components = [];

        this.wrap = function (obj) {
            if (Array.isArray(obj)) {
                for (let o of obj) {
                    this.dom.appendChild(o.dom);
                    this.components.push(o);
                }
            } else {
                this.dom.appendChild(obj.dom)
                this.components.push(obj);
            }
            return this;
        }
    }

}


/** Return a object with style object inside and styles properties passed through
 * Example: KDButton(KDStyler("backgroundColor", "red", "margin", "2px"))
 */
function KDStyler(args) {
    var i = 0;
    var obj = {};
    var style = {};
    for (i = 0; i < arguments.length; i += 2) {
        let p = arguments[i];
        let v = arguments[i + 1];
        style[p] = v;
    }
    obj["style"] = style;
    return obj;
}


/**
 * Function wich return a KDVisualContainerComponent object with DIV dom for populate with other KDs components
 * @param {*} properties 
 * @returns 
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

    vcc.setValues = function (data) {
        for (let c of vcc.components) {
            if (data[c.name] != undefined) { c.setValue(data[c.name]) }
        }
        return vcc;
    }

    vcc.dataChanged = function (component) {return component.getObject()}
    vcc.setDataChangedHandler = function(code) {vcc.dataChanged=code; return vcc}

    vcc.wrapSuper = vcc.wrap;
    vcc.wrap = function (objs) {
        if (Array.isArray(objs)) {
            for (var c of objs) {
                vcc.wrapSuper(c);
                c.dom.addEventListener("change", function(){vcc.dataChanged(c)})
            }
        } else {
            vcc.wrapSuper(objs);
            objs.dom.addEventListener("change", function(){vcc.dataChanged(objs)})
        
        }
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





function VStack(kdVisualComponents, properties) {
    var y = 0;
    var body = document.getElementsByTagName("body")[0];
    kdVisualComponents.forEach(function (v) {
        v.setTop(y);
        body.appendChild(v);
        y += v.height + v.verticalSeparation;
    });

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


