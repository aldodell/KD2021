"use strict";

var kdId = 0;

class KDObject {
    constructor(properties) {
        this.id = "";
        this.properties = properties;
        this.apply(properties);
        this.setId();
    }

    apply(properties) {
        if (properties != undefined) {
            for (let key of Object.keys(properties)) {
                this[key] = properties[key];
            }
        }
    }

    storeIn(name) {
        window[name] = this;
        return this;
    }

    setId() {
        let id = "KD_" + (++kdId).toString();
        this.id = id;
        if (this.dom != undefined) {
            this.dom.setAttribute("id", this.id);
        }
    }

    className() {
        return this.constructor.name;
    }

    clone() {
        return new this.constructor(this.properties);
    }

}

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

    }

    publish(comp) {
        if (comp == undefined) {
            comp = {};
            comp.dom = document.getElementsByTagName("body")[0];
        }

        comp.dom.appendChild(this.dom);
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

    completeValue(value) {
        if (this.valuePrefix != undefined) value = this.valuePrefix + value;
        if (this.valueSuffix != undefined) value = value + this.valuePrefix;
        return value;
    }

    setValue(value) {
        this.value = value;
        this.dom.value = this.completeValue(value);
        return this;
    }

    getValue() {
        return this.dom.value;
    }

    clone() {
        let o = super.clone();
        o.dom = this.dom.cloneNode(false);
        o.dom.setAttribute("id", o.id);
        o.attachEvents(this.eventHandlers);
        if (this.value != undefined) o.setValue(this.value);
        if (this.name != undefined) o.setName(this.name);
        if (this.parent != undefined) o.parent = this.parent;
        o.valuePrefix = this.valuePrefix;
        o.valueSuffix = this.valueSuffix;
        o.dom.mirror = o;

        return o;
    }

    addEvent(eventType, handler) {
        this.dom.addEventListener(eventType, handler);
        let ev = { "type": eventType, "handler": handler }
        this.eventHandlers.push(ev);
        return this;

    }

    attachEvents(eventHandlers) {
        for (let ev of eventHandlers) {
            this.addEvent(ev.type, ev.handler)
        }
        return this;
    }

    setName(name) {
        this.name = name;
        this.dom.name = name;
        return this;
    }

}


class KDVisualComponent extends KDComponent {
    constructor(properties, htmlClass, htmlType) {
        super(properties, htmlClass, htmlType);
        this.setStyles(properties);
    }

    setStyles(obj) {

        if (obj && obj.style) {
            for (let style in obj.style) {
                this.dom.style[style] = obj.style[style];
            }
        }
        return this;
    }

    setEnable(bool) {
        this.dom.disabled = !bool;
        return this;
    }
}


class KDVisualContainerComponent extends KDVisualComponent {
    constructor(properties, htmlClass, htmlType) {
        if (htmlClass == undefined) htmlClass = "div";
        super(properties, htmlClass, htmlType);
        if (this.components == undefined) this.components = [];
    }

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



class KDButton extends KDVisualComponent {
    constructor(properties) {
        super(properties, "input", "button");
    }
}

function kdButton(properties) {
    return new KDButton(properties);
}



class KDHidden extends KDVisualComponent {
    constructor(properties) {
        super(properties, "input", "hidden");
    }
}

function kdHidden(properties) {
    return new KDHidden(properties);
}



class KDText extends KDVisualComponent {
    constructor(properties) {
        super(properties, "input", "text");
    }
}

function kdText(properties) {
    return new KDText(properties);
}

class KDLabel extends KDVisualComponent {
    constructor(properties) {
        super(properties, "label");

    }

    setValue(value) {
        this.value = value;
        value = this.completeValue(value);
        this.dom.innerHTML = this.value;
        return this;
    }

    getValue() {
        return this.dom.innerHTML;
    }
}

function kdLabel(properties) {
    return new KDLabel(properties);
}


class KDImage extends KDVisualComponent {
    constructor(properties) {
        super(properties, "img");

    }

    setValue(value) {
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
                if (data[name] != undefined) {
                    c.setValue(data[name]);
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

/********************* DATA AREA ********************/



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



class KDServerBridge extends KDObject {
    /**
     * KDServerBridge constructor
     * @param {*} url 
     * @param {*} data raw data. 
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
                    ref.error_callback("ERROR loading data from " + url);
                    console.log("ERROR loading data from " + url);
                }
            }
        };
        http_request.open(this.method, this.url, true);
        http_request.send(this.data);
    }

}


/********************* STYLE AREA ********************/
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