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

        this.beforeSetValue = function (obj) { };

        if (properties != undefined && properties.value != undefined) {
            this.setValue(properties.value);
        }

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
        if (this.valueSuffix != undefined) value = value + this.valueSuffix;
        return value;
    }

    setBeforeSetValue(handler) {
        this.beforeSetValue = handler;
        return this;
    }

    setValue(value) {
        this.beforeSetValue(this);
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
        o.beforeSetValue = this.beforeSetValue;
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

    setOnDom(key, value) {
        this.dom[key] = value;
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

    setEditable(bool) {
        this.dom.contentEditable = bool;
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
        this.beforeSetValue(this);
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


class KDImage extends KDVisualComponent {
    constructor(properties) {
        super(properties, "img");

    }

    setValue(value) {
        this.beforeSetValue(this);
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
        this.beforeSetValue(this);
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
 * @returns 
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
     * @param {*} url 
     * @param {*} data Must be a KDDictionary
     * @param {*} progress_callback 
     * @param {*} success_callback 
     * @param {*} error_callback 
     * @param {*} method 
     * @param {*} mimeType 
     * @returns 
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
                    ref.error_callback("ERROR loading data from " + url);
                    console.log("ERROR loading data from " + url);
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


function kdJoinFormData(target, source) {
    for (let row of source) {
        let key = row[0];
        let value = row[1];
        target.append(key, value);
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

function kdColor(r, g, b, a) {
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}


/********************* APPLICATIONS AREA ********************/

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
        this.applicationClasses = new Array(0);
        this.applications = new Array(0);
    }

    /** Add an application */
    addApplication = function (kdApplicationClass) {
        this.applicationClasses.push(kdApplicationClass);
        return this;
    }

    /** Run all applications */
    run() {
        var kernel = this;
        this.applicationClasses.forEach(function (appClass) {
            var app = new appClass(this);
            kernel.applications.push(app);
            app.initializing();
        });
        return this;
    }

    /** Send messages to local registred applications */
    sendLocalMessage(kdMessage) {
        var re = new RegExp(kdMessage.destination);
        this.applications.forEach(function (app) {
            if (re.test(app.id))
                app.process(kdMessage);
        });
        return this;
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

/** Windows and dialogs area */

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
}

function kdWindow(theme) {
    if (theme == undefined) {
        theme = kdWindowDefaultTheme;
    }
    //return new KDWindow(theme.main, theme.head, theme.body, theme.foot);
    return new KDWindow(theme);

}


var kdWindowDefaultTheme = {
    style: {
        position: "absolute",
        display: "inline-block",
        width: "50vw",
        height: "50vh",
        border: "1px solid black",
        backgroundColor: "white",
        boxShadow: "8px 8px 8px gray",
        left: "50%",
        transform: "translateX(-50%)"
    },
    head: {
        style: {
            position: "absolute",
            display: "inline-block",
            width: "100%",
            height: "40px",
            border: "1px solid black",
            backgroundColor: "blue",
            top: "0px",
            textAlign: "center",
            verticalAlign: "baseline",
        },
        title: {
            style: {
                color: "white",
                top: "calc(50% - 8px)",


            },
            value: "Hello!",
        }
    },
    body: {
        style: {
            position: "absolute",
            display: "inline-block",
            width: "calc(100% - 16px)",
            height: "calc(50vh - 80px)",
            border: "1px solid black",
            backgroundColor: "white",
            top: "41px",
            padding: "8px",
            overflow: "scroll",
        }
    },
    foot: {
        style: {
            position: "absolute",
            display: "inline-block",
            width: "100%",
            height: "40px",
            border: "1px solid black",
            backgroundColor: "gray",
            bottom: "0px",
        }
    }
}


var kdWindowHotTheme = {
    style: {
        position: "absolute",
        display: "inline-block",
        width: "50vw",
        height: "50vh",
        border: "1px solid red",
        backgroundColor: "white",
        boxShadow: "8px 8px 8px gray",
        left: "50%",
        transform: "translateX(-50%)"
    },
    head: {
        style: {
            position: "absolute",
            display: "inline-block",
            width: "100%",
            height: "40px",
            border: "1px solid black",
            backgroundColor: "orange",
            top: "0px",
            textAlign: "center",
            verticalAlign: "baseline",
        },
        title: {
            style: {
                color: "white",
                top: "calc(50% - 8px)",

            },
            value: "Hello!",
        }
    },
    body: {
        style: {
            position: "absolute",
            display: "inline-block",
            width: "calc(100% - 16px)",
            height: "calc(50vh - 80px)",
            border: "1px solid black",
            backgroundColor: "PapayaWhip",
            top: "41px",
            padding: "8px",
            overflow: "scroll",
        }
    },
    foot: {
        style: {
            position: "absolute",
            display: "inline-block",
            width: "100%",
            height: "40px",
            border: "1px solid black",
            backgroundColor: "darkorange",
            bottom: "0px",
        }
    }
}

var kdWindowTerminalTheme = {
    style: {
        position: "absolute",
        display: "inline-block",
        width: "50vw",
        height: "50vh",
        border: "1px solid red",
        backgroundColor: "black",
        boxShadow: "8px 8px 8px gray",
        left: "50%",
        transform: "translateX(-50%)"
    },
    head: {
        style: {
            position: "absolute",
            display: "inline-block",
            width: "100%",
            height: "40px",
            border: "1px solid black",
            backgroundColor: "MidnightBlue",
            color: "white",
            top: "0px",
            textAlign: "center",
            verticalAlign: "baseline",
        },
        title: {
            style: {
                color: "white",
                top: "calc(50% - 8px)",

            },
            value: "Hello!",
        }
    },
    body: {
        style: {
            position: "absolute",
            display: "inline-block",
            width: "calc(100% - 16px)",
            height: "calc(50vh - 80px)",
            border: "1px solid black",
            backgroundColor: "black",
            color: "lime",
            top: "41px",
            padding: "8px",
            overflow: "scroll",
        }
    },
    foot: {
        style: {
            position: "absolute",
            display: "inline-block",
            width: "100%",
            height: "40px",
            border: "1px solid black",
            backgroundColor: "gray",
            bottom: "0px",
        }
    }
}


/** Area of functional applications */


class KDTerminal extends KDApplication {
    constructor(kernel) {
        super(kernel);
        this.window = undefined;
    }

    initializing() {
        this.window = new kdWindow(kdWindowTerminalTheme);
        this.window.body.setEditable(true);
        this.window.publish();
        this.window.body.dom.addEventListener("keypress", this.processKey);
    }

    processKey(e) {
        if (e.keyCode == 13) {
            var text;
            if (e.target.childNodes.length == 1) {

            }

            text = e.target.childNodes[e.target.childNodes.length - 1].innerText;
            alert(text);
        }
    }
}
