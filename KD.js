"use strict";

var kdId = 0;
const KD_ALL = ".*";
const KD_TOKENS = /[A-zÀ-ú\@\d\.\*\\]+/g;

/**
 * Master object of KD API.
 * @description This class is the root class of this API. All descendant
 * class wich implement must have and ID.
 */
class KDObject {
    constructor(properties) {
        this.id = "";
        this.properties = properties;
        this.apply(properties);
        this.setId();
    }

    /**
     * Apply properties to object
     * @param {*} properties 
     * @param {*} obj 
     */
    apply(properties, obj) {
        if (properties != undefined) {
            if (obj == undefined) { obj = this; }
            for (let key in properties) {
                let v = properties[key];
                if (typeof (v) === "object") {
                    if (obj[key] == undefined) {
                        obj[key] = v;
                    } else {
                        this.apply(v, obj[key]);
                    }
                } else {
                    obj[key] = v;
                }
            }
        }
    }


    /**
     * Save this object on a global property with this name.
     * @param {String} name 
     * @returns self object
     */
    storeIn(name) {
        window[name] = this;
        return this;
    }

    /**
     * Set ID property.
     */
    setId() {
        let id = "KD_" + (++kdId).toString();
        this.id = id;
        if (this.dom != undefined) {
            this.dom.setAttribute("id", this.id);
        }
    }

    /**
     * @returns Return class name
     */
    className() {
        return this.constructor.name;
    }

    /**
     * 
     * @returns Return a clone of this object.
     */
    clone() {
        return new this.constructor(this.properties);
    }

    /**
     * 
     * @param {String} text 
     * @returns return a hash code of this text
     */
    hash(text) {
        let b = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241];

        for (let i = 0; i < text.length; i++) {
            let c = text.charCodeAt(i);
            for (let j = 0; j < b.length; j++) {
                b[j] *= c;
                b[j] %= 251;
            }
        }

        let d = "";
        for (let e of b) {
            d += e.toString(16);
        }

        let e = d.substr(0, 2);
        e = parseInt(e, 16);
        e = e % b.length;
        //console.log(e);
        return d.substr(e, 16);
    }

    /**
     * 
     * @param {Date} date 
     * @returns a string with serial time.
     */
    serialTime(date) {

        function pad(n) {
            n = n.toString();
            if (n.length == 1) n = "0" + n;
            return n;
        }

        let Y = date.getUTCFullYear().toString();
        let m = pad(date.getUTCMonth() + 1);
        let d = pad(date.getUTCDate());
        let h = pad(date.getUTCHours());
        let i = pad(date.getUTCMinutes());
        let s = pad(date.getUTCSeconds());
        let r = Y + m + d + h + i + s + "000000";
        return r;
    }
}


/**
 * Base class for KD components
 * @extends KDObject
 * @description This class is use to configure components which
 * could be visible or not. Do not implement this class diretly,
 * instead make childs from this base class.
 */
class KDComponent extends KDObject {
    constructor(properties, htmlClass, htmlType) {
        super(properties);

        if (htmlClass != undefined) {
            this.dom = document.createElement(htmlClass);
            this.dom.setAttribute("id", this.id);
        }

        if (htmlType != undefined) {
            this.dom.setAttribute("type", htmlType);
        }

        this.dom.mirror = this;
        this.value = undefined;
        this.name = "";
        this.eventHandlers = [];
        this.parent = undefined;

        this.doBeforeSetValue = function (obj) { };

        if (properties != undefined && properties.value != undefined) {
            this.setValue(properties.value);
        }

    }

    /**
     * Publish this component on another DOM object. If comp is null BODY DOM component is assumed.
     * @param {HtmlElement} comp 
     * @returns self reference
     */
    publish(comp) {
        if (comp == undefined) {
            comp = {};
            comp.dom = document.getElementsByTagName("body")[0];
        }

        comp.dom.appendChild(this.dom);
        return this;
    }

    /**
     * Set a prefix for value property
     * @param {*} prefix 
     * @returns self reference
     */
    setValuePrefix(prefix) {
        this.valuePrefix = prefix;
        return this;
    }

    /**
   * Set a suffix for value property
   * @param {*} prefix 
   * @returns self reference
   */
    setValueSuffix(suffix) {
        this.valueSuffix = suffix;
        return this;
    }

    /**
     * Merge prefix + value + suffix
     * @param {*} value 
     * @returns value with prefix and suffix
     */
    completeValue(value) {
        if (this.valuePrefix != undefined) value = this.valuePrefix + value;
        if (this.valueSuffix != undefined) value = value + this.valueSuffix;
        return value;
    }

    /**
     * Set handler wich will be called before set value
     * @param {Function} handler function to be called.
     * @returns self reference
     */
    setDoBeforeSetValue(handler) {
        this.doBeforeSetValue = handler;
        return this;
    }

    /**
     * Set value property
     * @param {*} value 
     * @returns self reference
     */
    setValue(value) {
        this.doBeforeSetValue(this);
        this.value = value;
        this.dom.value = this.completeValue(value);
        return this;
    }

    /**
     * Get component value
     * @returns value
     */
    getValue() {
        return this.dom.value;
    }

    /**
     * Clone this object
     * @returns A clone of this object
     */
    clone() {
        let o = super.clone();

        o.dom = this.dom.cloneNode(false);
        o.dom.setAttribute("id", o.id);
        o.attachEvents(this.eventHandlers);
        if (this.value != undefined) o.setValue(this.value);
        if (this.name != undefined) o.setName(this.name);
        if (this.parent != undefined) o.parent = this.parent;
        if (this.data != undefined) o.data = this.data;
        if (this.textField != undefined) o.textField = this.textField;
        if (this.valueField != undefined) o.valueField = this.valueField;

        o.doBeforeSetValue = this.doBeforeSetValue;
        o.valuePrefix = this.valuePrefix;
        o.valueSuffix = this.valueSuffix;
        o.dom.mirror = o;
        return o;
    }

    /**
     * Add an event handler
     * @param {String} eventType like "click" or "keypress"
     * @param {*} handler to be called when event fires.
     * @returns self reference
     */
    addEvent(eventType, handler) {
        this.dom.addEventListener(eventType, handler);
        let ev = { "type": eventType, "handler": handler }
        this.eventHandlers.push(ev);
        return this;

    }

    /**
     * Attach events to new objects.
     * @param {*} eventHandlers Is a object with two properties: type and handler.
     * The <b>type</b> property must is a String object like "click" or "mouseover".
     * The <b>handler</b> property must is a function wich will be called when event fires.
     * 
     * @returns self reference
     */
    attachEvents(eventHandlers) {
        for (let ev of eventHandlers) {
            this.addEvent(ev.type, ev.handler)
        }
        return this;
    }

    /**
     * Set name property
     * @param {String} name 
     * @returns self reference
     */
    setName(name) {
        this.name = name;
        this.dom.name = name;
        return this;
    }

    /**
     * Set directly a DOM property
     * @param {*} key property name
     * @param {*} value to be set
     * @returns self reference
     */
    setOnDom(key, value) {
        this.dom[key] = value;
        return this;
    }



}

/**
 * Base class of visual components.
 *  @extends KDComponent
 */
class KDVisualComponent extends KDComponent {
    constructor(properties, htmlClass, htmlType) {
        super(properties, htmlClass, htmlType);
        this.setStyles(properties);
    }

    /**
     * Set styles properties with {@link KDStyles}
     * @param {KDStyles} obj 
     * @returns self reference
     */
    setStyles(obj) {
        if (obj && obj.style) {
            for (let style in obj.style) {
                this.dom.style[style] = obj.style[style];
            }
        }
        return this;
    }

    /**
     * Set enabled (or not)
     * @param {*} bool 
     * @returns self reference
     */
    setEnabled(bool) {
        this.dom.disabled = !bool;
        return this;
    }

    /**
     * Set editable (or not)
     * @param {*} bool 
     * @returns self reference
     */
    setEditable(bool) {
        this.dom.contentEditable = bool;
        return this;
    }

    /**
     * @deprecated
     * @returns index of caret position
     */
    getCaretIndex() {
        //https://gist.github.com/isLishude/6ccd1fbf42d1eaac667d6873e7b134f8

        // for contentedit field
        if (this.dom.contentEditable) {
            this.dom.focus()
            let _range = document.getSelection().getRangeAt(0)
            let range = _range.cloneRange()
            range.selectNodeContents(this.dom)
            range.setEnd(_range.endContainer, _range.endOffset)
            return range.toString().length;
        }
        // for texterea/input element
        return this.target.selectionStart
    }

    /**
     * Set caret index
     * @param {Int} pos 
     * @returns position
     */
    setCaretIndex(pos) {
        // for contentedit field
        if (this.dom.contentEditable) {
            this.dom.focus()
            document.getSelection().collapse(this.dom, pos)
            return;
        }
        this.target.setSelectionRange(pos, pos);
    }

    /**
     * Set placeholder
     * @param {String} text 
     * @returns self reference
     */
    setPlaceHolder(text) {
        this.dom.placeholder = text;
        return this;
    }

}

/**
 * Container components base class
 * {@extends KDVisualComponent}
 */
class KDVisualContainerComponent extends KDVisualComponent {
    constructor(properties, htmlClass, htmlType) {
        if (htmlClass == undefined) htmlClass = "div";
        super(properties, htmlClass, htmlType);
        if (this.components == undefined) this.components = [];
    }

    /**
     * Wrap a components array. Could be used convenience methods in order to create components.
     * @returns itself.
     */
    wrap() {
        for (let component of arguments) {
            if (Array.isArray(component)) {
                for (let comp of this.component) {
                    comp.parent = this;
                    this.components.push(comp);
                    this.dom.appendChild(comp.dom);

                }
            } else {
                component.parent = this;
                this.components.push(component);
                this.dom.appendChild(component.dom);
            }
        }
        return this;
    }


    clone() {
        let obj = super.clone();
        for (let c of this.components) {
            obj.wrap(c.clone());
        }
        return obj;
    }



}


/**
 * Button class wrapper
 * @extends {KDVisualComponent}
 */
class KDButton extends KDVisualComponent {
    constructor(properties) {
        super(properties, "input", "button");
    }
}

/**
 * Convenience method for create a button.
 * @param {*} properties 
 * @returns itself instance
 */
function kdButton(properties) {
    return new KDButton(properties);
}


/**
 * Hidden field class wrapper
 */
class KDHidden extends KDVisualComponent {
    constructor(properties) {
        super(properties, "input", "hidden");
    }
}

/**
 * Convenience method for create a hidden HTML element.
 * @param {*} properties 
 * @return itself instance
 */
function kdHidden(properties) {
    return new KDHidden(properties);
}


/**
 * Select form field wrapper
 * @extends KDVisualComponent
 */
class KDSelector extends KDVisualComponent {
    constructor(properties) {
        super(properties, "select");
        this.textField = "text"; //default name
        this.valueField = "value"; //default name

    }
    /**
     * Set text and value fields names.
     * @param {*} text Name of field of data row wich will be show.
     * @param {*} value Name of field of data row wich will be getted with getValue
     */
    setFields(text, value) {
        this.textField = text;
        this.valueField = value;
        return this;
    }

    /**
     * Set data to be shown.
     *
     * @example 
     * var data = [{text:"a", value:"0"},{text:"b", value:"1"} ]
     * @param {*} data is an array with key:value form.
     */
    setData(data) {
        this.data = data;
        return this;
    }

    /**
     * Clear selector.
     */
    clear() {
        this.dom.innerHTML = "";
        return this;
    }


    /**
     * Fill this selector with data from data property.
     */
    fill() {
        this.clear();
        if (this.data != null) {
            for (let obj of this.data) {
                let opt = document.createElement("option");
                opt.value = obj[this.valueField];
                opt.innerHTML = obj[this.textField];
                this.dom.appendChild(opt);
            }
        }
        return this;
    }

    /**
     * Select the row with this value
     * @param {*} value 
     */
    setValue(value) {
        this.fill();
        super.setValue(value);
        return this;
    }

    /**
     * Remove an option in a selector(or all selectors with same name)
     * @param {*} value to be removed
     * @param {bool} all true for all selectors with same name. Otherwise just this selector.
     */
    removeOption(value, all) {
        if (all) {
            for (var sel of document.getElementsByName(this.name)) {
                console.log(sel.id);
                for (let i = sel.options.length - 1; i >= 0; i--) {
                    if (sel.options[i].value == value) {
                        sel.remove(i);
                    }
                }
            }
        }
    }


    clone() {
        let o = super.clone();
        for (let e of this.dom.options) {
            o.dom.appendChild(e.cloneNode(true));
        }
        return o;
    }
}

/**
 * Convenience method for create a Selector component
 * @param {properties} properties 
 * @returns itself.
 */
function kdSelector(properties) {
    return new KDSelector(properties);
}

/**
 * Text field class wrapper
 * @extends {KDVisualComponent}
 */
class KDText extends KDVisualComponent {
    constructor(properties) {
        super(properties, "input", "text");
    }
}

/**
 * Convenience method for create a text HTML element.
 * @param {*} properties 
 * @return itself instance
 */
function kdText(properties) {
    return new KDText(properties);
}

/**
 * Radio field class wrapper
 */
class KDRadioButton extends KDVisualComponent {
    constructor(properties) {
        super(properties, "input", "radio");
    }

    setValue(value) {
        this.dom.checked = value == "1";
        return this;
    }

    getValue() {
        return this.dom.checked ? "1" : "0";
    }
}

/**
 * Convenience method for create a radio button HTML element.
 * @param {*} properties 
 * @return itself instance
 */
function kdRadioButton(properties) {
    return new KDRadioButton(properties);
}


/**
 * Checkbox wrapper. Set value to 1 if checked or 0 to else.
 */
class KDCheckbox extends KDVisualComponent {
    constructor(properties) {
        super(properties, "input", "checkbox");

    }

    setValue(value) {
        this.dom.checked = value == "1";
        return this;
    }

    getValue() {
        return this.dom.checked ? "1" : "0";
    }
}

/**
 * Convenience method for create a checkbox HTML element.
 * @param {*} properties 
 * @return itself instance
 */
function kdCheckbox(properties) {
    return new KDCheckbox(properties);
}


/**
 * @extends {KDVisualComponent}
 * @description Class used for wrap a script and execute it.
 */
class KDScript extends KDVisualComponent {
    constructor(properties) {
        super(properties, "script");

    }

    setValue(value) {
        this.doBeforeSetValue(this);
        this.value = value;
        value = this.completeValue(value);
        this.dom.src = value;
        return this;
    }

    getValue() {
        return this.dom.src;
    }

    setAsync(value) {
        this.dom.async = value;
        return this;
    }
}

function kdScript(properties) {
    return new KDScript(properties);
}


class KDLabel extends KDVisualComponent {
    constructor(properties) {
        super(properties, "label");

    }

    setValue(value) {
        this.doBeforeSetValue(this);
        this.value = value;
        value = this.completeValue(value);
        this.dom.innerHTML = value;
        return this;
    }

    getValue() {
        return this.dom.innerHTML;
    }
}

function kdLabel(properties) {
    return new KDLabel(properties);
}

/**
 * Span HTML tag wrapper
 * @extends KDVisualContainerComponent
 */
class KDSpan extends KDVisualContainerComponent {
    constructor(properties) {
        super(properties, "span");

    }

    setValue(value) {
        this.doBeforeSetValue(this);
        this.value = value;
        value = this.completeValue(value);
        this.dom.innerHTML = value;
        return this;
    }

    getValue() {
        return this.dom.innerHTML;
    }

}

function kdSpan(properties) {
    return new KDSpan(properties);
}

class KDImage extends KDVisualComponent {
    constructor(properties) {
        super(properties, "img");

    }

    setValue(value) {
        this.doBeforeSetValue(this);
        this.value = value;
        value = this.completeValue(value);
        this.dom.src = value;
        return this;
    }

    getValue() {
        return this.dom.src;
    }
}

function kdImage(properties) {
    return new KDImage(properties);
}


/**
 * Visual container component wich is usefull to syncronize data with inner components.
 * @extends {KDVisualContainerComponent}
 */
class KDLayer extends KDVisualContainerComponent {
    constructor(properties, htmlClass) {
        super(properties, "div");
        this.name = '*';
        this.componentsTemplate = [];
    }


    saveStructure() {
        this.componentsTemplate = [];
        for (let c of this.components) {
            this.componentsTemplate.push(c);
        }
        return this;
    }

    clear() {
        this.components = [];
        this.dom.innerHTML = "";
        return this;
    }

    restore() {
        this.clear();
        for (let c of this.componentsTemplate) {
            this.wrap(c);
        }
    }

    /**
     * Value must be an object with named properties to syncronize with children
     * @param {*} value 
     */
    setValue(data) {
        this.doBeforeSetValue(this);
        //If we need only propagate data from parent to it's children, without create
        //new components
        if (Array.isArray(data)) {
            //copy and save components:
            let tempComponents = [];
            for (let c of this.components) {
                tempComponents.push(c);
            }
            //Clear components
            this.components = [];
            this.dom.innerHTML = "";

            for (let row of data) {
                for (let c of tempComponents) {
                    c = c.clone();
                    let name = c.name.trim();
                    if (name == "*") {
                        c.setValue(row);
                    } else if (name != "") {
                        c.setValue(row[name]);
                    }
                    this.wrap(c);
                }
            }
        } else {
            for (let c of this.components) {
                let name = c.name.trim();
                if (name == "*") {
                    c.setValue(data);
                } else if (name != "") {
                    if (data[name] != undefined) {
                        c.setValue(data[name]);
                    }
                }

            }
        }

        return this;
    }


    getValue() {
        //Detect if is a array or an object:
        let isArray = true;
        for (let c of this.components) {
            if (c.className() != "KDLayer") {
                isArray = false;
                break;
            }
        }
        if (isArray) {
            let table = [];
            for (let c of this.components) {
                table.push(c.getValue());
            }
            return table;
        } else {
            let row = {};
            for (let c of this.components) { //.dom.childNodes
                //let c = d.mirror;
                let name = c.name.trim();
                if (name != "") {
                    row[name] = c.getValue();
                }
            }
            return row;
        }
    }

    toString() {
        return JSON.stringify(this.getValue());
    }
}


function kdLayer(properties) {
    return new KDLayer(properties);
}

class KDHiperlink extends KDVisualComponent {

    constructor(properties) {
        super(properties, "a");
    }

    setValue(value) {
        this.value = value;
        let href = this.completeValue(value["href"]);
        let label = value["label"];
        this.dom.setAttribute("href", href);
        this.dom.innerText = label;
        return this;
    }

}

function kdHiperlink(properties) {
    return new KDHiperlink(properties);
}


/**
 * Layer used for send files to server.
 * Call .active method is madatory
 * @param {} properties 
 */
class KDDropFileZone extends KDVisualContainerComponent {

    constructor(properties) {
        super(properties, "div");

        this.preventDefault = function (ev) {
            ev.preventDefault();
        }

        this.dom.ondragenter = this.preventDefault;
        this.dom.ondragover = this.preventDefault;
        this.dom.ondragleave = this.preventDefault;
    }

    /**
     * 
     * @param {String} url 
     * @param {KDDictionary} data Must be a KDDictionary
     * @param {Function} progress_callback 
     * @param {Function} success_callback 
     * @param {Function} error_callback 
     * @param {String} method Could be "post" or "get" (and others methods too.)
     * @param {String} mimeType Like "text/css".
     */
    active = function (url, data, progress_callback, success_callback, error_callback, method, mimeType) {
        if (progress_callback == undefined) progress_callback = function (progress, quantity) { }
        if (success_callback == undefined) success_callback = function (m) { }
        if (error_callback == undefined) error_callback = function (m) { }

        this.dom.ondrop = function (ev) {
            ev.preventDefault();
            let dt = ev.dataTransfer;
            let files = dt.files;
            let filesAr = [...files];
            var i = 0;

            filesAr.forEach(
                file => {
                    let data2 = new FormData();
                    kdJoinFormData(data2, data);
                    data2.append("file", file)
                    let bridge = new KDServerBridge(url, data2, function (m) { progress_callback(i, filesAr.length, m); success_callback(m) }, error_callback, method, mimeType);
                    bridge.request();
                    i++;
                }
            )
        };
        return this;
    }
}

function kdDropFileZone(properties) {
    return new KDDropFileZone(properties);
}


/********************* DATA AREA ********************/
/**
 *  @extends KDObject
 */
class KDDictionary extends KDObject {
    constructor() {
        super();
        this.data = [];
    }

    append(key, value) {
        let o = {};
        o[key] = value;
        this.data.push(o);
        return this;
    }

    merge(dictionary) {
        for (let o of dictionary.data) {
            this.data.push(o);
        }
        return this;
    }

    getValue(key) {
        return this.data[key];
    }

    existsKey(key) {
        for (let o of this.data) {
            if (o.data[key] != undefined) {
                return true;
            }
        }
        return false;
    }

    toFormData() {
        let fd = new FormData()
        for (let row of this.data) {
            for (let key in row) {
                fd.append(key, this.data[key]);
            }
        }
        return fd;
    }

    clear() {
        this.data = [];
        return this;
    }
}


/**
 * Base64 utility
 */
class KDBase64 {
    toBase64(str) {
        return window.btoa(encodeURIComponent(str));
    }

    fromBase64(bin) {
        return decodeURIComponent(window.atob(bin));
    }
}

class KDData {
    constructor(data) {
        this.innerData = data;
    }

    setData(data) {
        this.innerData = data;
        return this;
    }

    getData() {
        return this.innerData;
    }
    parseJson(string) {
        this.innerData = JSON.parse(string);
        return this;
    }
    toString() {
        return JSON.stringify(this.innerData);
    }

    filter(filterFunction) {
        var data2 = [];
        for (let e of this.innerData) {
            if (filterFunction(e)) {
                data2.push(e);
            }
        }
        return data2;
    }
}

function kdData(data) {
    return new KDData(data);
}


/**
 * 
 * Class wich manage HTTP request.
 * 
 */
class KDServerBridge extends KDObject {
    /**
     * KDServerBridge constructor
     * @param {*} url 
     * @param {*} data raw data. Must be a KDDictionary or a FormData
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

    request() {
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
                    ref.error_callback("ERROR loading data from " + ref.url);
                    console.log("ERROR loading data from " + ref.url);
                }
            }
        };

        if (this.data instanceof KDDictionary) {
            this.data = this.data.toFormData();
        }

        http_request.open(this.method, this.url, true);
        http_request.send(this.data);
    }

}

function kdServerBridge(url, data, success_callback, error_callback, method, mimeType) {
    return new KDServerBridge(url, data, success_callback, error_callback, method, mimeType);
}


function kdJoinFormData(target, source) {
    for (let row of source) {
        let key = row[0];
        let value = row[1];
        target.append(key, value);
    }
}


/**
 * Class to manipulate local files
 */
class KDFile extends KDObject {
    constructor() {
        super();
    }
    /**
     * Read a file locally
     * @param {*} file name
     * @param {*} callback a function with a unique parameter to pass data from file
     */
    read(file, callback) {
        let rawFile = new XMLHttpRequest();
        rawFile.open("GET", file, true);
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


var kdFile = new KDFile();


/********************* STYLE AREA ********************/

/**
 * Style class wrapper.
 */
class KDStyles extends KDObject {
    constructor(properties) {
        super(properties);
        this.style = {}
    }

    setStyles(styleObject) {
        for (let key in styleObject) {
            this.style[key] = styleObject[key];
        }
        return this;
    }
}

function kdStyles(properties) {
    let s = new KDStyles();
    for (let p of arguments) {
        s.setStyles(p);
    }
    return s;
}

function kdColor(r, g, b, a) {
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}


/********************* APPLICATIONS AREA ********************/
/**
 * Wrapper for messages
 */
class KDMessage extends KDObject {
    /**
     * @param {String} destination Application wich will receive message
     * @param {String} payload Data to be send
     * @param {String} origin Application wich had create the message
     * @param {String} producer User who created the message.
     * @param {String} consumer User who will receive the message.
     */
    constructor(destination, payload, origin, producer, consumer) {
        super();
        this.origin = origin;
        this.destination = destination == null ? KD_ALL : destination;
        this.payload = payload;
        this.producer = producer;
        this.consumer = consumer;
        this.date = this.serialTime(new Date());
    }

    /**
     * Split payloads words. If there are not words to be proccessed return null.
     * @returns Splitted payloads words (tokens) or undefined if there aren't words.
     */
    getTokens() {
        // return this.payload.match(KD_TOKENS);
        let r = this.payload.split(/[\t\x20]+/);
        if (r[0].length == 0) { return undefined; } else { return r; };

    }

    /**
     * 
     * @returns JSON message representation
     */
    toString() {
        return JSON.stringify(this);
    }

    /**
     * Build a message from a JSON string
     * @param {String} json JSON string.
     * @returns self reference
     */
    fromJson(json) {
        let o = JSON.parse(json);
        this.origin = o.origin;
        this.destination = o.destination;
        this.payload = o.payload;
        this.producer = o.producer;
        this.consumer = o.consumer;
        this.date = o.date;
        return this;
    }

    /**
     * 
     * @returns a token (word from payload, and delete it from payload object property)
     */
    reducePayload() {
        let tokens = this.getTokens()
        let r = tokens.shift();
        this.payload = tokens.join(" ");
        return r;

        /*
        let n = this.payload.indexOf(" ");
        if (n > -1) {
            let t = this.payload.substr(0, n).trim();
            this.payload = this.payload.substr(n).trim();
            return t;
        } else {
            return this.payload;
        }
        */
    }
}

/**
 * Functional {@link KDMessage} builder
  * @param {String} destination Application wich will receive message
     * @param {String} payload Data to be send
     * @param {String} origin Application wich had create the message
     * @param {String} producer User who created the message.
     * @param {String} consumer User who will receive the message.
 *   @returns a {@link KDMessage} object
 */
function kdMessage(destination, payload, origin, producer, consumer) {
    return new KDMessage(destination, payload, origin, producer, consumer);
}

/**
 * KicsyDell Kernel Object.
 * 
 * This class wrap a main routines like a system operating kernel. 
 * Has the responsability of send, read and proccess messages through differents internet nodes
 * wich support KD. Loads KD applications, and connect those with a server(PHP kind server).
 * It is a entry point too.
 * All html files wich are used to run KD applications must implements a KD kernel in this way:
 * <code>var kdKernel = new KDKernel();</code>
 * The main file KD.js has this line implemented. So its't neccesary write it again.
 * 
 * 
 * @extends KDObject
 * 
 */
class KDKernel extends KDObject {
    constructor() {
        super();
        this.applications = new Array(0);
        this.initialized = false;
        /**
         * Server URL string
         */
        this.serverUrl = "server2022.php";
        this.messageSymbol = "m";
        this.currentUser = new KDUser();
        this.timeToReadMessages = 5000; //miliseconds
        this.timer = null;
        this.lastMessageIndex = "0";
        this.id = "KERNEL";
    }

    /**
     * @description Use for set URL property
     * @param {String} url 
     * @returns self reference
     */
    setServerUrl(url) {
        this.serverUrl = url;
        return this;
    }

    /**
     * Add an application by class name of a {@link KDApplication}.
     * @param {String} kdApplicationClass {@link KDApplication} name.
     * @returns self reference.
     */
    addApplication(kdApplicationClass) {
        var app;
        if (typeof kdApplicationClass === "string") {
            app = eval("new " + kdApplicationClass + "(this);");
        } else {
            app = new kdApplicationClass(this);
        }

        this.applications.push(app);
        app.initializing();
        return this;
    }

    /**
     * Load a javascript file and retrieve the {@link KDApplication}.<br/>
     * <b>IMPORTANT: File name must end in ".js", and must be
     * equal to class name.</b>
     * 
     * @param {String} className 
     * @param {Bool} runAfterLoad Indicate if runs inmediatly after load script.
     */
    loadApplication(className, runAfterLoad) {
        let file = className + ".js";
        let s = document.createElement("script");
        s.src = file;
        var k = this;
        s.addEventListener("load", function () {
            eval("k.addApplication(className)");
            if (runAfterLoad) k.runApplication(className);
        });
        document.getElementsByTagName("body")[0].appendChild(s);
        return this;
    }

    /** 
     * Run all applications
     *  */
    initialize() {
        var thisKernel = this;
        this.timer = window.setInterval(
            function (thisKernel) {
                if (thisKernel.currentUser.name != "guess") {
                    let fullName = thisKernel.currentUser.fullName();
                    let m = kdMessage(
                        "server",
                        "getMessages " + thisKernel.lastMessageIndex,
                        "KDKernel",
                        fullName,
                        fullName
                    );
                    thisKernel.sendRemoteMessage(m,
                        function (answer) {
                            if (answer != "false") {
                                try {
                                    let messages = JSON.parse(answer);
                                    for (let message of messages) {
                                        let m = new KDMessage(message["destination"], message["payload"], message["origin"], message["producer"], message["consumer"], message["date"]);
                                        thisKernel.lastMessageIndex = m.date;
                                        thisKernel.sendLocalMessage(m);
                                    }
                                } catch (er) {
                                    thisKernel.print(er);
                                }
                            }
                        }
                    );
                }
            },
            this.timeToReadMessages, //Time between calls
            this // kernel reference
        );

        return this;
    }

    /**
     * Send messages to local applications registred on KERNEL
     * @param {KDMessage} message {@link KDMessage}
     * @returns self reference.
     */
    sendLocalMessage(message) {
        if (message.destination == this.id) {
            let tokens = message.getTokens();
            if (tokens[0] == "setUser") {
                this.currentUser = kdUser(tokens[1]);
            }

        } else {
            var re = new RegExp(message.destination);
            this.applications.forEach(function (app) {
                if (re.test(app.id))
                    app.processMessage(message);
            });
        }
        return this;
    }

    /**
     * Send a {@link KDMessage} to KicsyDell server.
     * @param {KDMessage} message to be send.
     * @param {Handler} success_callback a method(or function) with a unique parameter (text send by server).
     * @param {Handler} error_callback  a method(or function) with a unique parameter (text send by server).
     * @returns self reference.
     */
    sendRemoteMessage(message, success_callback, error_callback) {
        let data = new FormData();
        data.append(this.messageSymbol, message.toString())
        let server = new KDServerBridge(this.serverUrl, data, success_callback, error_callback);
        server.request();
        return this;
    }

    /**
     * Check if an application is loaded.
     * @param {String} id 
     * @returns 
     */
    constainsApplication(id) {
        for (let app of this.applications) {
            if (app.id == id) return true;
        }
        return false;
    }

    /**
     * Run an application by it id.
     * @param {String} id 
     * @returns 
     */
    runApplication(id) {
        for (let app of this.applications) {
            if (app.id == id) {
                app.run();
                return this;
            }
        }
        return this;
    }

    print(text) {
        console.log(text);
    }
}

const KDApplicationStatus = {
    STOPPED: "STOPPED",
    RUNNING: "RUNNING",
}

function kdApplicationStatus() {
    return new KDApplicationStatus();
}

/** 
 * Application base class 
 *  @extends KDObject
 * */
class KDApplication extends KDObject {
    constructor(kernel) {
        super();

        /** Application identifier */
        this.id = this.constructor.name;

        /** Reference to kernel  */
        this.kernel = kernel;
        this.status = KDApplicationStatus.STOPPED;
    }

    /**
     * This method ask to current user object if has permission to open.
     * @returns boolean 
     */
    requestAuthorization() {
        return this.kernel.currentUser.checkAuthorizedApplication(this.id);
    }

    run(params) {
        if (this.status == KDApplicationStatus.STOPPED) {
            this.status = KDApplicationStatus.RUNNING;
            return true;
        } else {
            return false;
        }
    }

    /** Initializing cycle life 
     * @param params any object to configure the application
    */
    initializing(params) { }

    /** Must be override in order to process messages
     * @param kdMessage object type KDMessage 
     */
    processMessage(params) { }


}

class KDLoginApp extends KDApplication {
    constructor(kernel) {
        super(kernel);
        this.id = "login";
    }


    processMessage(message) {
        let tokens = message.getTokens();
        let fullname = tokens[0];
        let password = tokens[1];
        let hashPassword = this.hash(password);
        let m = kdMessage(
            "server",
            "login " + fullname + " " + hashPassword,
            "KDLogin",
            this.kernel.currentUser.fullName(),
            this.kernel.currentUser.fullName()
        );
        var theKernel = this.kernel;
        theKernel.sendRemoteMessage(
            m,
            function (answer) {
                try {
                    let json = JSON.parse(answer);
                    let m = kdMessage();
                    m.fromJson(answer);
                    let tokens = m.getTokens();
                    let fullName = tokens[1];
                    let authorizedApplications = JSON.parse(m.payload.substr(tokens[0].length + tokens[1].length + 1));
                    console.log(authorizedApplications);
                    theKernel.currentUser = kdUser(fullName);
                    theKernel.currentUser.authorizedApplications = authorizedApplications;

                } catch (error) {
                    theKernel.print(error);
                }
            }

        );
    }


}


/** 
 * User class wrapper
 * 
 */
class KDUser {
    constructor(name, organization) {
        this.name = name == undefined ? "guess" : name;
        this.organization = organization == undefined ? "generic" : organization;
        this.authorizedApplications = [];
    }

    setName(name, organization) {
        this.name = name;
        this.organization = organization;
        return this;
    }

    fullName() {
        return this.name + "@" + this.organization;
    }

    fromJson(json) {
        let o = JSON.parse(json);
        this.name = o.name;
        this.organization = o.organization;
        this.authorizedApplications = o.authorizedApplications;
        return this;
    }

    checkAuthorizedApplication(applicationId) {
        return this.authorizedApplications.indexOf(applicationId) > -1;
    }


}


function kdUser(fullName) {
    let name = fullName.substr(0, fullName.indexOf("@"));
    let organization = fullName.substr(name.length + 1);
    return new KDUser(name, organization);
}


/** 
 * Windows and dialogs area 
 * */
class KDWindowManager extends KDObject {
    constructor(properties) {
        super(properties);
        this.windows = [];
    }

    addWindow(kdWin) {
        this.windows.push(kdWin);
        return this;
    }

    normalizeZIndex() {
        for (let w of this.windows) {
            w.dom.style.zIndex = 0;
        }
        return this;
    }
}

/** Window's manager instance */
var kdWindowManagerInstance = new KDWindowManager();

/**
 * KDWindow class. 
 * This properties must be wrapped with an object with fallows structure:
 * Obj.main
 * Obj.head
 * Obj.body
 * Obj.foot
 * 
 */
class KDWindow extends KDVisualContainerComponent {
    // constructor(mainProperties, headProperties, bodyProperties, footProperties) {
    constructor(properties) {
        super(properties, "div");
        kdWindowManagerInstance.addWindow(this);

        this.head = kdLayer(properties.head);
        this.body = kdLayer(properties.body);
        this.foot = kdLayer(properties.foot);
        this.title = kdLabel(properties.head.title);
        this.head.wrap(this.title);
        this.wrap(this.head, this.body, this.foot);


        //Make draggable:
        this.head.dom.onmousedown = function (ev) {
            var pos1, pos2, pos3, pos4;

            ev = ev || window.event;
            ev.preventDefault();
            var elmnt = ev.target.parentNode;

            // get the mouse cursor position at startup:
            pos3 = ev.clientX;
            pos4 = ev.clientY;
            document.onmouseup = function (o) {
                document.onmousemove = null;
                document.onmouseup = null;
            };

            // call a function whenever the cursor moves:
            document.onmousemove = function (e) {
                e = e || window.event;
                e.preventDefault();

                // calculate the new cursor position:
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;

                // set the element's new position:
                elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
                elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
            };
        };

        this.head.dom.onclick = function (e) {
            kdWindowManagerInstance.normalizeZIndex();
            e.target.parentNode.style.zIndex = 1;
        }
    }

    wrapOnBody() {
        for (let c of arguments) {
            this.body.wrap(c);
        }
        return this;
    }

    setTitle(title) {
        this.title.setValue(title);
        return this;
    }

    changeSize(width, height) {
        this.dom.style.width = width;
        this.dom.style.height = height;
        return this;
    }

    hide() {
        this.dom.style.visibility = "hidden";
    }

    show() {
        this.dom.style.visibility = "visible";
    }
}


class KDWindowDefaultTheme extends KDObject {
    constructor(properties) {
        super(
            {
                style: {
                    position: "absolute",
                    display: "inline-block",
                    border: "1px solid black",
                    height: "60vh",
                    width: "70vw",
                    padding: "0px",
                },
                head: {
                    style: {
                        position: "inherit",
                        display: "inherit",
                        border: "inherit",
                        height: "40px",
                        width: "100%",
                        left: "-1px",
                        top: "-1px",
                        backgroundColor: "blue",
                        textAlign: "center",
                        lineHeight: "40px", // para centrar titulo
                    },
                    title: {
                        style: {
                            color: "white",
                            textTransform: "uppercase",
                            fontWeight: "bold",
                            textShadow: "1px 1px black",
                        }
                    },
                },

                body: {
                    style: {
                        position: "inherit",
                        display: "inherit",
                        border: "inherit",
                        height: "calc(100% - 88px)",
                        width: "calc(100% - 16px)",
                        left: "-1px",
                        top: "40px",
                        backgroundColor: "white",
                        overflow: "scroll",
                        fontSize: "1em",
                        padding: "8px",
                        whiteSpace: "pre-wrap",

                    }
                },

                foot: {
                    style: {
                        position: "inherit",
                        display: "inherit",
                        border: "inherit",
                        height: "38px",
                        width: "100%",
                        left: "-1px",
                        bottom: "-1px",
                        backgroundColor: "gray",
                    }
                },
            });
        this.apply(properties);
    }

    /*
    apply(properties, obj) {
        if (properties != undefined) {
            if (obj == undefined) { obj = this; }
            for (let key in properties) {
                let v = properties[key];
                if (typeof (v) === "object") {
                    this.apply(v, obj[key]);
                } else {
                    obj[key] = v;
                }
            }
        }
    }
    */
}

var kdWindowDefaultTheme = new KDWindowDefaultTheme();
var kdWindowOrangeTheme = new KDWindowDefaultTheme(
    {
        head:
        {
            style:
                { backgroundColor: "orange" }
        },
        body:
        {
            style:
            {
                backgroundColor:
                    "LightYellow"
            }
        }
    }
);

var kdWindowTerminalTheme = new KDWindowDefaultTheme(
    {
        head:
        {
            style:
            {
                backgroundColor: "navy",
                color: "white"
            }
        },
        body:
        {
            style:
            {
                backgroundColor: "black",
                color: "lime",
            },

        }
    }
);

/**
 * Convenience constructor for KDWindow class
 * @param {KDWindowDefaultTheme} theme 
 * @returns KDWindow intance
 */
function kdWindow(theme) {
    if (theme == undefined) {
        theme = kdWindowDefaultTheme;
    }
    //return new KDWindow(theme.main, theme.head, theme.body, theme.foot);
    return new KDWindow(theme);
}


/** 
 * Area of functional applications
 * {@extends KDApplication}
 *  */
class KDEvalApp extends KDApplication {
    constructor(kernel) {
        super(kernel);
        this.id = "eval";
    }

    processMessage(message) {
        if (message.destination == this.id) {
            if (message.payload == "") {
                this.kernel.sendLocalMessage(kdMessage("terminal", "release", "KDEval"));
            } else {
                try {
                    let r = " = " + eval(message.payload);
                    this.kernel.sendLocalMessage(kdMessage("terminal", r, "KDEval"));
                } catch (error) {
                    this.kernel.sendLocalMessage(kdMessage("terminal", r, "Error:" + error));
                }
            }
        }
    }
}

/** Area of functional applications */
class KDAlertApp extends KDApplication {
    constructor(kernel) {
        super(kernel);
        this.id = "alert";
    }

    processMessage(message) {
        if (message.destination == this.id) {
            if (message.payload == "") {
                this.kernel.sendLocalMessage(kdMessage("terminal", "release", "KDAlert"));
            } else {
                alert(message.payload);
            }
        }
    }
}



/**
 * This app enable CLI to send messages to server.
 * Messages syntax must be build like this:
 * server consumer destination payload....
 * consumer and destination arguments are mandatory if final destination are not server itself.
 */
class KDServerApp extends KDApplication {
    constructor(kernel) {
        super(kernel);
        this.id = "server";
    }

    /** Process messages  */
    processMessage(message) {

        let theKernel = this.kernel;

        //Message destination is SERVER
        if (message.payload != undefined) {

            //First token must be "request" or "answer".
            //Request goes from local to server
            //answer goes from server to local

            let command = message.reducePayload();
            let consumer = message.reducePayload();

            if (command == "request") {
                // server request <consumer|any> other payloads words
                let remoteMessage = kdMessage(command, message.payload, this.id, theKernel.currentUser.fullName(), consumer);

                theKernel.sendRemoteMessage(
                    remoteMessage,
                    //Process answer from server
                    function (answer) {
                        //alert(answer);
                        try {

                            //if answer is a JSON we can assume that is a message
                            //let json = JSON.parse(answer);
                            let m = new KDMessage();
                            m.fromJson(answer);

                            //Send the message locally
                            theKernel.sendLocalMessage(m);
                        } catch (error) {
                            theKernel.print(error);
                        }

                    },
                    theKernel.print
                )
            } else if (command == "answer") {
                theKernel.print(message.payload);
            }

            /*
             if (tokens.length >= 1) {
                 //If the message is for server
                 if (message.destination == this.id) {
 
                     //get consumer
                     let consumer = message.reducePayload();
 
                     //get destination
                     let destination = message.reducePayload();
 
                     //assign
                     message.consumer = consumer;
                     message.destination = destination;
 
                     //the producer is de current user logged
                     message.producer = this.kernel.currentUser.fullName();
                     message.origin = this.id;
                     let theKernel = this.kernel;
 
                     //Send de message to server
                     theKernel.sendRemoteMessage(
                         message,
                         //Process answer from server
                         function (answer) {
                             //alert(answer);
                             try {
 
                                 //if answer is a JSON we can assume that is a message
                                 //let json = JSON.parse(answer);
                                 let m = new KDMessage();
                                 m.fromJson(answer);
 
                                 //Send the message locally
                                 theKernel.sendLocalMessage(m);
                             } catch (error) {
                                 theKernel.print(error);
                             }
 
                         },
                         theKernel.print
                     )
                 }
             }
             */
        }
    }
}

class KDSerialTimeApp extends KDApplication {
    constructor(kernel) {
        super(kernel);
        this.id = "serialtime";
    }
    processMessage(message) {
        if (message.destination == this.id) {
            let tokens = message.getTokens();
            let d = new Date();
            if (tokens != undefined) {
                d = Date.parse(tokens[0]);
            }
            d = this.serialTime(d);
            this.kernel.print(d);
        }
    }
}


/*
class KDUserApp extends KDApplication {
    constructor(kernel) {
        super(kernel);
        this.id = "user";
    }

    processMessage(message) {
        if (message.destination == this.id) {
            let tokens = message.getTokens();
            let fullname = tokens[1];
            let hashPassword = this.hash(tokens[2]);
            let theKernel = this.kernel;

            switch (tokens[0]) {
                case "login":
                    let ma = kdMessage("server",
                        "login " + fullname + " " + hashPassword,
                        this.id,
                        "",
                        ""
                    );

                    this.kernel.sendRemoteMessage(ma, function (answer) {
                        let obj = JSON.parse(answer);
                        if (obj.name) {
                            let u = new KDUser();
                            theKernel.currentUser = u.fromJson(answer);
                            let m0 = kdMessage("terminal", "print User loaded!", this.id, theKernel.currentUser, theKernel.currentUser);
                            let m1 = kdMessage("terminal", "setPrefix " + u.fullName(), this.id, theKernel.currentUser, theKernel.currentUser);
                            theKernel.sendLocalMessage(m0);
                            theKernel.sendLocalMessage(m1);
                        } else {
                            let m = new KDMessage();
                            m = m.fromJson(answer);
                            theKernel.sendLocalMessage(m);
                        }
                    });
                    break;

                case "create":
                    let mb = kdMessage("server",
                        "create user " + fullname + " " + hashPassword,
                        this.id,
                        "",
                        ""
                    );

                    this.kernel.sendRemoteMessage(mb, function (answer) {
                        let obj = JSON.parse(answer);
                        if (obj.name) {
                            let u = new KDUser();
                            theKernel.currentUser = u.fromJson(answer);
                            let m0 = kdMessage("terminal", "print user create!", this.id, theKernel.currentUser, theKernel.currentUser);
                            theKernel.sendLocalMessage(m0);
                        } else {
                            let m = new KDMessage();
                            m = m.fromJson(answer);
                            theKernel.sendLocalMessage(m);
                        }
                    });
                    break;
            }
        }
    }
}
*/


class KDHashApp extends KDApplication {
    constructor(kernel) {
        super(kernel);
        this.id = "hash";
    }
    processMessage(message) {
        if (message.destination == this.id) {
            let tokens = message.getTokens();
            message.destination = "terminal";
            message.payload = this.hash(message.payload);
            this.kernel.sendLocalMessage(message);
        }
    }

}

/**
 * Usefull terminal likes bash style.
 * All commands are proccessed after ENTER KEY are press.
 * <br/>In order to send a {@link KDMessage} (local or remote) use this syntax: <b>destination</b> <i>payload</i>.
 * <p>See {@link KDKernel} to get information about how KERNEL proccess local messages.</p>
 * <p>See {@link KDServerApp} to get information about how to send {@link KDMessage} to server.</p>
 * <p>A way to run the terminal is via  <code>kdKernel.sendLocalMessage(kdMessage("terminal"));</code></p>
 */
class KDTerminalApp extends KDApplication {
    constructor(kernel) {
        super(kernel);
        this.window = undefined;
        this.id = "terminal";
        this.prefix = new KDSpan(kdStyles({ "fontFamily": "inherit", "fontSize": "inherit", "width": "calc(20%)" }));
        this.input = new KDText(kdStyles({ "backgroundColor": "inherit", "color": "inherit", "border": "none", "outline": "none", "fontFamily": "inherit", "fontSize": "inherit", "width": "calc(80%)" }));
        this.owner = undefined;
        this.lastLines = [];
        this.lastLinesIndex = 0;
    }

    focus(e) {
        e.preventDefault();
        if (e.target.terminal) {
            e.target.terminal.input.dom.focus();
        }
    }

    initializing() {
        this.window = new kdWindow(kdWindowTerminalTheme);
        this.window.kernel = this.kernel;
        this.window.body.dom.terminal = this;
        this.window.setTitle("Terminal");
        let it = this;
        this.kernel.print = function (t) { it.appendText(t, false) };
        this.window.body.wrap(this.prefix);
        this.window.body.wrap(this.input);
        this.input.dom.terminal = this;
        this.input.dom.addEventListener("keypress", this.processKey);
        this.input.dom.addEventListener("keydown", this.processKey2);
        this.window.body.dom.addEventListener("click", this.focus);
        this.prefix.setValue(this.kernel.currentUser.fullName() + ">");
    }

    run() {
        if (super.run()) {
            this.window.publish();
            this.appendText("Ready!");
        }
    }

    appendText(code) {
        this.prefix.setValue(this.kernel.currentUser.fullName() + ">");
        if (code.length > 0) {
            let node = document.createElement("div");
            node.innerHTML = code;
            this.window.body.dom.insertBefore(node, this.prefix.dom);
            this.input.dom.focus();
            this.window.body.dom.scrollTop = this.window.body.dom.scrollHeight;
        }
    }

    appendImage(src) {
        let im = document.createElement("img");
        im.src = src;
        this.window.body.dom.insertBefore(im, this.prefix.dom);
        this.input.dom.focus();
        this.window.body.dom.scrollTop = this.window.body.dom.scrollHeight;
    }


    processKey(e) {
        let ter = e.target.terminal;

        switch (e.keyCode) {
            case 13: //Enter
                e.preventDefault();
                let data = ter.input.getValue();
                ter.appendText(data);

                if (data.length > 0) {

                    //Split user input
                    let tokens = data.split(/[\x20\t]+/);
                    var dest = tokens[0];
                    var payload = data.substring(dest.length).trim();

                    //If terminal has owner take all input as payload.
                    //First word of payload isnt't 'terminal'
                    if (dest != ter.id && ter.owner != undefined) {
                        dest = ter.owner;
                        payload = data;
                    }

                    let m = kdMessage(dest, payload);
                    ter.kernel.sendLocalMessage(m);

                    ter.input.setValue("");
                    ter.lastLines.push(data);
                    ter.lastLinesIndex = ter.lastLines.length - 1;
                }
                break;

            default:
                break;

        }
    }

    processKey2(e) {

        let ter = e.target.terminal;
        switch (e.keyCode) {

            case 38:
                e.preventDefault();
                ter.lastLinesIndex--;
                if (ter.lastLinesIndex < 0) ter.lastLinesIndex = ter.lastLines.length - 1;
                ter.input.setValue(ter.lastLines[ter.lastLinesIndex]);
                break;

            case 40:
                e.preventDefault();
                ter.lastLinesIndex++;
                if (ter.lastLinesIndex == ter.lastLinesIndex) ter.lastLines.length = 0;
                ter.input.setValue(ter.lastLines[ter.lastLinesIndex]);
                break;


            default:
                break;

        }
    }

    processMessage(message) {

        if (message.destination == this.id || message.destination == "!") {
            if (message.payload == undefined) {
                this.run();
            } else {
                let tokens = message.getTokens();
                switch (tokens[0]) {

                    /* 
                    When a message was send to terminal and its first parameter is take
                    make this app the new terminal owner
                    */
                    case "take":
                        if (tokens.length > 1) {
                            let owner = tokens[1];
                            if (this.kernel.constainsApplication(owner)) {
                                this.owner = tokens[1];
                                this.appendText("[" + this.owner + "]");
                            }
                        }
                        break;

                    case "release":
                        this.owner = null;
                        break;


                    case "show":
                        if (tokens[1] == "applications") {
                            var r = "\n";
                            for (let app of this.kernel.applications) {
                                r = r + app.id + "\n";
                            }
                            this.appendText(r);
                        }
                        break;

                    case "print":
                        message.reducePayload();
                        this.appendText(message.payload, false);
                        break;

                    case "setPrefix":
                        message.reducePayload();
                        this.prefix.setValue(message.payload + ">");
                        break;

                    case "image":
                        this.appendImage(tokens[1]);
                        break;

                    default:
                        this.appendText(message.payload, true);
                        break;
                }
            }
        }
    }
}

class KDHackApp extends KDApplication {
    constructor(kernel) {
        super(kernel);
        this.id = "hack";
        this.idStage = 0;
        this.stage = {};
        this.userInput = undefined;
        let thisApp = this;
        kdFile.read("hack.js", function (code) { thisApp.stage = eval(code); });

    }

    show(t) {
        let m = kdMessage("terminal", "print " + t)
        this.kernel.sendLocalMessage(m);
    }

    showImage(src) {
        let m = kdMessage("terminal", "image " + src)
        this.kernel.sendLocalMessage(m);

    }

    next() {
        this.idStage++;
        this.runStage();
    }

    jump(id) {
        this.idStage = id;
        this.runStage();
    }

    wait(miliseconds) {
        let thisApp = this;
        window.setTimeout(function () { thisApp.next() }, miliseconds);
    }

    runStage() {
        let stage = this.stage[this.idStage];
        stage(this);
    }

    processMessage(message) {
        if (message.payload == ".") {
            this.runStage();
        } else {

            switch (message.payload) {
                case "./next":
                    this.next();
                    break;
                default:
                    this.userInput = message.payload;
                    this.next();
                    break;

            }

        }
    }




}



/** Main instance of KERNEL. Must be after defaults applications */
var kdKernel = new KDKernel();
kdKernel
    .addApplication(KDTerminalApp)
    .addApplication(KDAlertApp)
    .addApplication(KDServerApp)
    // .addApplication(KDUserApp)
    .addApplication(KDHashApp)
    .addApplication(KDEvalApp)
    .addApplication(KDSerialTimeApp)
    .addApplication(KDLoginApp)
    .addApplication(KDHackApp)

    .initialize();