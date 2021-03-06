"use strict";
var KD_ALL = ".*";
var KD_ID = 0;
var kdDefaultGraphicUnit = "px";


/** Base class of Kicsy obects */
class KDObject {
    constructor(properties) {
        this.properties = properties;
        this.kdReflector = "KDObject";
        this.getId();
        //Check properties nullity
        if (properties == undefined) properties = {};
        //process each property
        for (let p in properties) {
            this[p] = properties[p];
        }
    }

    getId() {
        this.id = "KD_" + (++KD_ID);
    }

    setId(ID) {
        this.id = ID;
        if (this.dom != undefined) {
            this.dom.id = ID;
        }
        return this;
    }

    cloneArray(obj) {
        let r = [];
        for (let e of obj) {
            if (Array.isArray(e)) { e = this.cloneArray(e); }
            r.push(e);
        }
        return r;
    }

    clone() {
        return this.preClone(KDObject, this.properties);
    }

    preClone(objClass, properties) {
        let obj = new objClass(properties);
        for (let key of Object.keys(this)) {
            let prop = this[key];
            if (Array.isArray(prop)) {
                prop = this.cloneArray(prop);
            }
            obj[key] = prop;
        }
        return obj;
    }


    toBase64(str) {
        return window.btoa(encodeURIComponent(str));
    }

    fromBase64(bin) {
        return decodeURIComponent(window.atob(bin));
    }

    storeIn(variableName) {
        window[variableName] = this;
        return this;
    }

    /**
     * Use to import all properties from kdObject to this object.
     * @param {*} kdObject 
     */
    apply(kdObject) {
        this.appliedObject = kdObject;
        this.appliedObject();
    }

    showProperties(r) {
        if (r == undefined) r = "";
        for (let p in this) {
            r = r + p + "\n";
            if (p.showProperties != undefined) {
                r = r + "\t\n";
                r = p.showProperties(r);
            }
        }
        return r;
    }

    setTag(value) {
        this.tag = value;
        return this;
    }

    getTag() { return this.tag; }
}

function kdError(msg) {
    alert(msg);
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
    }

    /** Initializing cycle life 
     * @param params any object to configure the application
    */
    initializing(params) { }

    /** Must be override in order to process messages
     * @param kdMessage object type KDMessage 
     */
    process(params) { }

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
    constructor(properties, htmlClass, htmlType) {
        super(properties);
        this.name = this.id;
        this.htmlClass = htmlClass;
        this.htmlType = htmlType;

        //Define a value if is undefined
        if (this.value == undefined) { this.value = "" }

        //Handling suffix and prefix values
        this.valuePrefix = undefined;
        this.valueSuffix = undefined;
        this.eventHandlers = [];

        //Check html class
        if (this.htmlClass == null) { this.htmlClass = "div" }

        //Create DOM
        this.dom = document.createElement(this.htmlClass);

        //Type attribute
        if (this.htmlType != undefined) {
            this.dom.setAttribute("type", this.htmlType);
        }

        //Assign Id
        this.dom.id = this.id;

        //Check some common properties
        if (this.value) this.dom.value = this.value;

        //Parent kdComponent
        this.parent = null;
    }

    /** Set name field. Used with binder works */
    setName(name) {
        this.name = name;
        if (this.dom.name != undefined) { this.dom.name = name; }
        return this;
    }


    /** Send to body current KDs components */
    sendToBody() {
        document.getElementsByTagName("body")[0].appendChild(this.dom);
        return this;
    }

    setValuePrefix(prefix) {
        this.valuePrefix = prefix;
        return this;
    }

    setValueSuffix(suffix) {
        this.valueSuffix = suffix;
        return this;
    }


    /** Add prefix and suffix if any */
    prepareValue(value) {
        if (this.valuePrefix != undefined) {
            value = this.valuePrefix + value;
        }

        if (this.valueSuffix != undefined) {
            value = value + this.valueSuffix;
        }
        return value;
    }

    /**  Set value at dom object. */
    setValue(value) {
        this.value = value;
        value = this.prepareValue(value);
        this.dom.value = value;
        return this;
    }

    /** Get value from dom value property */
    getValue() {
        this.value = this.dom.value;
        return this.value;
    }

    /** Get an object with name and value properties */
    getObject() { var o = {}; o[this.name] = this.getValue(); return o }


    /**
     * Add an event handler to DOM. 
     * @param {String} eventType String wich represents event name like "click"
     * @param {Function} callback Function with a parameter passing itself javascript object.
     * @returns itself
     */
    addEvent(eventType, callback) {
        var comp = this;
        this.dom.addEventListener(eventType, function () { callback(comp) });
        this.eventHandlers.push({ "eventType": eventType, "callback": callback, "direct": false })
        return this;
    }

    /**
     * Add an event handler to DOM. But directly attached. Is exactly like addEventListener
     * @param {*} eventType 
     * @param {*} callback 
     * @returns 
     */
    addEventDirectly(eventType, callback) {
        this.dom.addEventListener(eventType, callback);
        this.eventHandlers.push({ "eventType": eventType, "callback": callback, "direct": true })
        return this;
    }


    clone() {
        let obj = super.preClone(KDComponent, this.properties);
        obj.dom = obj.dom.cloneNode(true);
        for (let e of this.eventHandlers) {
            if (e.direct) {
                obj.dom.addEventListener(e.eventType, e.callback);
            } else {
                obj.dom.addEventListener(e.eventType, function () { e.callback(obj) });
            }

        }
        return obj;
    }

    /** Manage onChange event on HTML subaycent object */
    setChangeHandler(code) { this.addEvent("change", code); return this }

}


/** Visual component class base */
class KDVisualComponent extends KDComponent {
    constructor(properties, htmlClass, htmlType) {
        super(properties, htmlClass, htmlType);
        this.height = 20;
        this.width = 100;

        //Set styles
        for (let s in this.style) {
            this.dom.style[s] = this.style[s];
        }
    }


    suffixGraphicUnit(size) {
        return isNaN(size) ? size : size + kdDefaultGraphicUnit;
    }

    setHeight(value) {
        this.height = value;
        this.dom.style.height = this.suffixGraphicUnit(value);
        return this;
    }

    setWidth(value) {
        this.width = value;
        this.dom.style.width = this.suffixGraphicUnit(value);
        return this;
    }

    getWidth() {
        return this.dom.offsetWidth;
    }

    getHeight() {
        return this.dom.offsetHeight;
    }


    setTop(value) {
        this.dom.style.top = this.suffixGraphicUnit(value);
        return this;
    }

    setLeft(value) {
        this.dom.style.left = this.suffixGraphicUnit(value);
        return this;
    }

    setBottom(value) {
        this.dom.style.bottom = this.suffixGraphicUnit(value);
        return this;
    }

    setRight(value) {
        this.dom.style.right = this.suffixGraphicUnit(value);
        return this;
    }


    setEnabled(boolValue) {
        this.dom.disabled = !boolValue;
        return this;
    }

    setHint(text) {
        this.dom.placeholder = text;
        return this;
    }

    setContentEditable(booleanValue) {
        this.dom.contentEditable = booleanValue;
        return this;
    }

    setTabIndex(value) {
        this.dom.tabIndex = value;
        return this;
    }

    setCaretPosition(caretPos) {
        var elem = this.dom;

        if (elem != null) {
            if (elem.createTextRange) {
                var range = elem.createTextRange();
                range.move('character', caretPos);
                range.select();
            }
            else {
                if (elem.selectionStart) {
                    elem.focus();
                    elem.setSelectionRange(caretPos, caretPos);
                }
                else
                    elem.focus();
            }
        }
        return this;
    }
}



/** Components with inner components */
class KDVisualContainerComponent extends KDVisualComponent {
    constructor(properties, htmlClass, htmlType) {
        super(properties, htmlClass, htmlType);
        this.components = [];
    }

    wrap() {
        for (let obj of arguments) {
            if (Array.isArray(obj)) {
                for (let o of obj) {
                    this.dom.appendChild(o.dom);
                    this.components.push(o);
                    o.parent = this;
                }
            } else {
                this.dom.appendChild(obj.dom);
                this.components.push(obj);
                obj.parent = this;
            }
        }
        return this;
    }


    /**
     * Return a component with same properties from parent
     * @returns KDComponent
     */


    clone() {
        let obj = this.preClone(KDVisualContainerComponent, this.properties);
        for (let comp of this.components) {
            obj.wrap(comp.clone());
        }
        return obj;
    }


    /**
     * Clear a node in specific position or all children if position==undefined
     * @param {Int} position 
     */
    clear(position) {
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


class KDStyler extends KDObject {
    constructor(args) {
        super();
        this.style = {}
        for (let p of args) {
            //Verificamos primero si el argumento pasado es otro styler:
            if (p instanceof KDStyler) {
                for (let n of Object.keys(p.style)) {
                    this.style[n] = p.style[n];
                }
            } else {
                for (let n of Object.keys(p)) {
                    this.style[n] = p[n];
                }
            }
        }
    }

    toString(r) {

        if (r == undefined) r = "";
        for (let key of Object.keys(this.style)) {
            r = r + key + ":" + this.style[key] + "\n";
        }
        return r;

    }


    apply(kdVisualComponent) {
        for (let key of Object.keys(this.style)) {
            kdVisualComponent.dom.style[key] = this.style[key];
        }
        return this;
    }


}

function kdStyler(args) {
    return new KDStyler(arguments);
}



class KDLayer extends KDVisualContainerComponent {

    constructor(properties) {
        super(properties, "div");
    }

    getValue() {
        return vcc.dom.innerHTML;
    }

    setValue(value) {
        this.value = value;
        this.dom.innerHTML = value;
        return this;
    }

    setText(text) {
        vcc.dom.innerText = text;
        return this;
    }

    clone() {
        return this.preClone(KDLayer, this.properties);
    }
}

function kdLayer(properties) {
    return new KDLayer(properties);
}



/**
 * 
 */
class KDServerBridge extends KDObject {
    /**
     * KDServerBridge constructor
     * @param {*} url 
     * @param {*} data raw data. Consider to use kdFormData or simple FormData
     * @param {*} success_callback 
     * @param {*} error_callback 
     * @param {*} method 
     * @param {*} mimeType 
     */
    constructor(url, data, success_callback, error_callback, method, mimeType) {
        super();
        this.url = url;
        this.success_callback = success_callback;
        this.error_callback = error_callback;
        this.method = method;
        this.mimeType = mimeType;
        this.data = data;
    }


    send() {
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
 * Allways use .formData property as final chain secuence like:
 * var fd = kdFormData(aFormDataObject).append("a",1).append("b",2).formData;
 * @param {*} formData 
 * @returns FormData
 */
function kdFormData(formData) {
    var obj = {};

    if (formData == undefined) {
        obj.formData = new FormData();
    } else {
        obj.formData = formData;
    }

    obj.append = function (key, value, param) {
        if (param != undefined) {
            obj.formData.append(key, value, param);
        } else {
            obj.formData.append(key, value);
        }
        return obj;
    }

    return obj;
}

/**
 * Return a special kdLayer to wrap kdComponents and syncronize it with data
 * using "data" property. This property is a javascript object wich have properties like
 * a dictionary. Each property name is binded with each component with same name.
 * 
 * @param {*} properties 
 * @returns 
 */
class KDBinder extends KDLayer {
    constructor(properties) {

        super(properties);
        this.properties = properties;
        this.kdReflector = "kdBinder";
        this.extraData = {};

        /** Data reference object */
        this.data = {}

        /** Event onDataChanged */
        this.onDataChanged = function (object) { }
    }

    /** 
     * Assign a function with an only parameter data to retrieve changes when user modify data
     * Example:
     * .setOnDataChanged(function(obj){alert(JSON.stringify(obj))})
     * */
    setOnDataChanged(code) {
        this.onDataChanged = code;
        return this;
    }

    appendExtraData(key, value) {
        this.extraData[key] = value;
        return this;
    }

    /**
     * 
     * @returns A object with kdComponents values
     */
    getValue() {
        var data = this.extraData;
        for (let c of this.components) { //Each component of a jsonAdapter are binders
            if (c.name != undefined) {
                let name = c.name.trim();
                if (name != "") {
                    data[name] = c.getValue();
                }
            }
        }
        this.data = data;
        return data;
    }


    /**
     * Set children's components values. If there is a KDBinder as child, it's name design a property name
     * wich could have some data objects.
     * If it's neccesary to pass all data from parent data, the child binder name must be set at "*"
     * @param {*} data 
     * @returns 
     */
    setValue(data) {
        this.value = data;

        if (Array.isArray(data)) {
            for (let row of data) {
                var newBinder = this.clone();
                newBinder.setValue(row);
            }
        } else {
            for (let comp of this.components) {
                let name = comp.name.trim();
                if (name != "") {
                    if (name == "*") {
                        comp.setValue(data);
                    } else {
                        let row = data[name];
                        if (row != undefined) {
                            comp.setValue(row);
                        }
                    }
                }
            }
            this.parent.wrap(this);
        }

        return this;

    }


    clone() {
        var b = new KDBinder(this.properties);
        b.setName(this.name);
        b.extraData = this.extraData;
        b.parent = this.parent;
        for (let c of this.components) {
            b.wrap(c.clone())
        }
        return binder;
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
    getFilteredValue(fieldValueName, filter) {
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

    clear() {
        this.data = {};
        return this;
    }

    /**
     * Set directly a pair key/value on KDBinder data property 
     * @param {*} key 
     * @param {*} value 
     */
    setDataEntry(key, value) {
        this.data[key] = value;
        return this;
    }
}

function kdBinder(properties) {
    return new KDBinder(properties);
}


/**
 * Wrapper to perform JSON and XmlRequest activities.
 * Set values of wrapped components. 
 * Usually this have an unique component like a kdBinder
 * @param {*} properties 
 * @returns 
 */
class KDJsonAdapter extends KDLayer {
    constructor(properties) {
        super(properties)
        this.binder = null;
        this.extraData = new FormData();
        this.dataFieldName = "data";
    }

    /**
     * Clear extra data form
     */
    clearExtraData() {
        layer.extraData = new FormData();
        return layer;
    }

    /**
     * Append key - value pair for make a server request
     * @param {*} key 
     * @param {*} value 
     * @returns 
     */
    appendExtraData(key, value) {
        this.extraData.append(key, value);
        return this;
    }

    /**
     * Each kdJsonAdapter must have a kdBinder inner object. Use this method for binder it.
     * @param {*} binder 
     * @returns 
     */

    wrapBinder(binder) {
        this.binder = binder;
        this.binder.parent = this;
        return this;
    }


    /**
     * Dot no use.
     * @param {*} data 
     */
    loaded(data) {
        var _data = JSON.parse(data);
        this.binder.setValue(_data);
        return this;
    }

    /**
     * Make a request to server and load data. Then make a list with all children of binder objects
     * @param {*} url 
     * @param {*} success_callback 
     * @param {*} error_callback 
     * @param {*} method 
     * @param {*} mimeType 
     * @returns 
     */
    load(url, success_callback, error_callback, method, mimeType) {
        //Configure server bridge
        let adapter = this;
        let success_callback_wrap = function (data) {
            adapter.loaded(data);
            if (success_callback != undefined) {
                success_callback(data);
            }

        }

        var bridge = new KDServerBridge(
            url,
            this.extraData,
            success_callback_wrap,
            error_callback,
            method,
            mimeType
        );

        //Send request
        bridge.send();

        return this;
    }

    /**
     * Retrieve all binders data, pack into json and base64 and make a request to server.
     * 
     * @param {*} url 
     * @param {*} success_callback 
     * @param {*} error_callback 
     * @param {*} method 
     * @param {*} mimeType 
     * @returns 
     */
    save(url, success_callback, error_callback, method, mimeType) {

        var data = [];

        //Get values from binder
        for (let binder of this.components) {
            data.push(binder.getValue());
        }

        //Trasnform data into JSON
        data = JSON.stringify(data);

        //Transform json data into base64
        data = this.toBase64(data);

        //Append data to DataForm object
        this.extraData.append(this.dataFieldName, data);

        //Prepare brigde and send
        var bridge = new KDServerBridge(
            url,
            this.extraData,
            function (data) {
                //this.loaded(data);
                if (success_callback != undefined) {
                    success_callback(data);
                }
            },
            error_callback,
            method,
            mimeType
        );

        //Send request
        bridge.send();

        return this;
    }


}

function kdJsonAdapter(properties) {
    return new KDJsonAdapter(properties);
}

class KDButton extends KDVisualComponent {
    constructor(properties) {
        super(properties, "input", "button");
    }
}



/** Function return a Button  */
function kdButton(properties) {
    return new KDButton(properties);
}

/**
 * Function wich return a simple text input field
 * @param {*} properties 
 * @returns 
 */

class KDTextField extends KDVisualComponent {
    constructor(properties) {
        super(properties, "input", "text");
    }
}

function kdTextField(properties) {
    return new KDTextField(properties);
}




class KDMultilineTextField extends KDVisualComponent {
    constructor(properties) {
        super(properties, "textarea");
    }
}


function kdMultilineTextField(properties) {
    return new KDMultilineTextField(properties);
}


class KDImage extends KDVisualComponent {
    constructor(properties) {
        super(properties, "img");
    }

    setValue(url) {
        this.value = url;
        url = this.prepareValue(url);
        setTimeout(function (p) {
            p.dom.setAttribute("src", url);
        }, 1000, this);
        return this;
    }

    getValue() {
        return this.value;
    }

}


function kdImage(properties) {
    return new KDImage(properties);
}



class KDCheckBox extends KDVisualComponent {
    constructor(properties) {
        super(properties, "input", "checkbox");
    }
    getValue() { return this.dom.checked }
    setValue(status) { this.dom.checked = status; return this; }
}

function kdCheckBox(properties) {
    return new KDCheckBox(properties);
}

class KDSpan extends KDVisualComponent {
    constructor(properties) {
        super(properties, "span");
    }

    setValue(value) {
        this.dom.textContent = value;
        return this;
    }
}

function kdSpan(properties) {
    return new KDSpan(properties);

}

function kdVerticalScroll(properties) {
    var layer = kdLayer(properties);
    layer.dom.style.overflowY = "scroll";
    return layer;

}


class KDLabel extends KDVisualComponent {
    constructor(properties) {
        super(properties, "label");
    }

    setValue(value) {
        this.value = this.value;
        this.dom.innerHTML = this.prepareValue(this.value);
        return this;
    }


}


function kdLabel(properties) {
    return new KDLabel(properties);
}

class KDHorizontalLine extends KDVisualComponent {
    constructor(properties) {
        super(properties, "hr");
    }

}

function kdHorizontalLine(properties) {
    return new KDHorizontalLine(properties);
}



class KDProgressBar extends KDVisualComponent {
    constructor(properties) {
        if (properties == undefined) properties = {};
        if (properties.value == undefined) properties.value = 0;
        if (properties.max == undefined) properties.max = 1;
        super(properties, "progress");


    }

    setMaximum(max) {
        this.dom.max = max;
        return this;
    }

}


function kdProgress(properties) {
    return new KDProgressBar(properties);
}




/**
 * Function wich return a hperlink. 
 * Note override setValue method accept an object with two properties. 
 * First is a hiperlink text, and second the label.
 * @param {*} properties 
 * @returns 
 */

class KDHiperlink extends KDVisualComponent {

    constructor(properties) {
        super(properties, "a");
    }

    setValue(value) {
        this.value = value;
        let href = this.prepareValue(value["href"]);
        let label = value["label"];
        this.dom.setAttribute("href", href);
        this.dom.innerText = label;
        return this;
    }

    clone() {
        return this.preClone(KDHiperlink, this.properties);
    }

}

function kdHiperlink(properties) {
    return new KDHiperlink(properties);
}





/**
 * Layer used for send files to server.
 * Call .active method is madatory
 * @param {} properties 
 * @returns 
 */
function kdDropFileZone(properties) {
    var layer = kdLayer(properties);

    layer.preventDefault = function (ev, layer, style) {
        ev.preventDefault();
        if (style != undefined) {
            layer.apply(style);
        }
    }

    layer.dragEnterStyle = undefined;
    layer.dragLeaveStyle = undefined;
    layer.dragOverStyle = undefined;

    layer.setDragEnterStyle = function (style) { layer.dragEnterStyle = style; return layer; }
    layer.setDragLeaveStyle = function (style) { layer.dragLeaveStyle = style; return layer; }
    layer.setDragOverStyle = function (style) { layer.dragOverStyle = style; return layer; }

    /**
     * Method to make active the Drope File Zone
     * @param {*} url 
     * @param {*} extraFormData Data within kdFormData object
     * @param {*} progress_callback Method with this sign: callback(i, files length)
     * @param {*} success_callback 
     * @param {*} error_callback 
     * @param {*} method 
     * @param {*} mimeType 
     * @returns 
     */
    layer.active = function (url, extraFormData, progress_callback, success_callback, error_callback, method, mimeType) {
        if (progress_callback == undefined) progress_callback = function (progress, quantity) { }
        layer.addEventDirectly("dragenter", layer.preventDefault, layer.dragEnterStyle);
        layer.addEventDirectly("dragover", layer.preventDefault, layer.dragOverStyle);
        layer.addEventDirectly("dragleave", layer.preventDefault, layer.dragLeaveStyle);

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
                    let data = kdFormData(extraFormData)
                        .append("file", file)
                        .formData;
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
var kdStyleDisplayInlineBlock = function () { return kdStyler({ "display": "inline-block" }); }
var kdStyleDisplayFlex = function () { return kdStyler({ "display": "flex" }); }

var kdStyleSizeParameter = function (value, defaultValue, parameter) {
    if (value == undefined) value = defaultValue;
    if (typeof (value) === "number") {
        var s = value + kdDefaultGraphicUnit;
    } else {
        s = value;
    }
    var obj = {};
    obj[parameter] = s;
    return kdStyler(obj);
}

var kdStyleHeight = function (value) {
    return kdStyleSizeParameter(value, 100, "height");
}

var kdStyleMinHeight = function (value) {
    return kdStyleSizeParameter(value, 100, "minHeight");
}

var kdStyleMaxHeight = function (value) {
    return kdStyleSizeParameter(value, 100, "maxHeight");
}

var kdStyleWidth = function (value) {
    return kdStyleSizeParameter(value, 100, "width");
}

var kdStyleMinWidth = function (value) {
    return kdStyleSizeParameter(value, 100, "minWidth");
}

var kdStyleMaxWidth = function (value) {
    return kdStyleSizeParameter(value, 100, "maxWidth");
}


var kdStyleSize = function (width, height) {
    let r = kdStyler(kdStyleWidth(width), kdStyleHeight(height));
    return r;

}

var kdStyleMinSize = function (width, height) {
    let r = kdStyler(kdStyleMinWidth(width), kdStyleMinHeight(height));
    return r;

}

var kdStyleMaxSize = function (width, height) {
    let r = kdStyler(kdStyleMaxWidth(width), kdStyleMaxHeight(height));
    return r;
}



var kdStyleOneOrFewParameters = function (parameters, styleTag) {
    let r = "";
    if (parameters != undefined) {
        for (let p of parameters) {
            if (typeof (p) === "number") { p = p + kdDefaultGraphicUnit }
            r = r + p + " ";
        }
        r = r.trim();
    }
    let obj = {}
    obj[styleTag] = r;
    r = kdStyler(obj);
    return r;
}


var kdStyleMargin = function () {
    return kdStyleOneOrFewParameters(arguments, "margin");
}

var kdStylePadding = function () {
    return kdStyleOneOrFewParameters(arguments, "padding");
}


var kdStyleBorder = function (size, color, style) {
    if (size == undefined) size = 1;
    if (!isNaN(size)) size = size + kdDefaultGraphicUnit;
    if (color == undefined) color = "black";
    if (style == undefined) style = "solid";
    var s = size + " " + color + " " + style;
    return kdStyler({ "border": s })
}
var kdStyleCenterHorizontally = function () {
    return kdStyler({ "margin": "0 auto" });
}


var kdStyleBackgroundColor = function (color) {
    return kdStyler({ "backgroundColor": color });
}

var kdStyleVerticalScrollBar = function (value) {
    if (value == undefined) value = "scroll";
    return kdStyler({ "overflowY": value });
}

var kdStyleVerticalAlign = function (value) {
    if (value == undefined) value = "top";
    return kdStyler({ "verticalAlign": value });
}

var kdStylePosition = function (type, top, right, bottom, left) {
    if (type == undefined) type = "absolute";
    var z = kdStyler({ "position": type });

    if (top != undefined) {
        top = top + (!isNaN(top) ? kdDefaultGraphicUnit : "");
        z.style.top = top;
    }

    if (right != undefined) {
        right = right + (!isNaN(right) ? kdDefaultGraphicUnit : "");
        z.style.right = right;
    }

    if (bottom != undefined) {
        bottom = bottom + (!isNaN(bottom) ? kdDefaultGraphicUnit : "");
        z.style.bottom = bottom;
    }

    if (left != undefined) {
        left = left + (!isNaN(left) ? kdDefaultGraphicUnit : "");
        z.style.left = left;
    }

    return z;
}

var kdStyleFontColor = function (color) { return (kdStyler({ "color": color })) }
var kdStyleFontSize = function () { return kdStyleOneOrFewParameters(arguments, "fontSize") }





