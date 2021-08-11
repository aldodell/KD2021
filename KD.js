"use strict";

var kdId = 0;
const KD_ALL = ".*";

/**
 * Make a hash value form a string;
 * @param {*} text 
 * @returns 
 */




class KDObject {
    constructor(properties) {
        this.id = "";
        this.properties = properties;
        this.apply(properties);
        this.setId();
    }

    /*
    apply(properties) {
        Object.assign(this, properties);
        return this;
    }
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




    /*
        apply(properties) {
            if (properties != undefined) {
                for (let key of Object.keys(properties)) {
                    let prop = properties[key];
                    this[key] = prop;
                }
            }
        }
        */




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

        this.doBeforeSetValue = function (obj) { };

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

    setDoBeforeSetValue(handler) {
        this.doBeforeSetValue = handler;
        return this;
    }

    setValue(value) {
        this.doBeforeSetValue(this);
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
        o.doBeforeSetValue = this.doBeforeSetValue;
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


    setCaretIndex(pos) {
        // for contentedit field
        if (this.dom.contentEditable) {
            this.dom.focus()
            document.getSelection().collapse(this.dom, pos)
            return;
        }
        this.target.setSelectionRange(pos, pos);
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
                    ref.error_callback("ERROR loading data from " + this.url);
                    console.log("ERROR loading data from " + this.url);
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


/**
 * Class to manipulate local files
 */
class KDFile extends KDObject {
    constructor() {
        super();
        this.read = function (file, callback) {
            var rawFile = new XMLHttpRequest();
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
}

var kdFile = new KDFile();


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



/**
 * Wrapper for messages
 */
class KDMessage extends KDObject {
    /**
     * 
     * @param {string} destination Application wich will receive message
     * @param {*} payload Data to be send
     * @param {*} origin Application wich had create the message
     * @param {*} producer User who created the message.
     * @param {*} consumer User who will receive the message.
     */
    constructor(destination, payload, origin, producer, consumer) {
        super();
        this.origin = origin;
        this.destination = destination == null ? KD_ALL : destination;
        this.payload = payload;
        this.producer = producer;
        this.consumer = consumer;
        this.date = Date()
    }

    getTokens() {
        return this.payload.match(/[\w|@|\d]+/g);
    }

    toString() {
        return JSON.stringify(this);
    }

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

    reducePayload() {
        let n = this.payload.indexOf(" ");
        if (n > -1) {
            let t = this.payload.substr(0, n).trim();
            this.payload = this.payload.substr(n).trim();
            return t;
        } else {
            return this.payload;
        }
    }
}

function kdMessage(destination, payload, origin, producer, consumer) {
    return new KDMessage(destination, payload, origin, producer, consumer);
}

/** KERNEL OF KD2021 API */
class KDKernel extends KDObject {
    constructor() {
        super();
        this.applications = new Array(0);
        this.initialized = false;
        this.serverUrl = "server.php";
        this.messageSymbol = "m";
        this.currentUser = new KDUser();
        //this.userInterfaceApplication = undefined;
        this.timeToReadMessages = 3000; //miliseconds
        this.timer = null;
    }


    setServerUrl(url) {
        this.serverUrl = url;
        return this;
    }

    /** Add an application */
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
     * Load a javascript file and retrieve the KDApplication
     * IMPORTANT: File name must end in ".js", and must be
     * equal to class name.
     * 
     * @param {String} className 
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


    /** Run all applications */
    initialize() {
        this.timer = window.setInterval(
            function (kernel) {
                if (kernel.currentUser.name != "guess") {
                    let fullName = kernel.currentUser.fullName();
                    let m = kdMessage(
                        "server",
                        "getMessages",
                        "KDKernel",
                        fullName,
                        fullName
                    );
                    kernel.sendRemoteMessage(m,
                        function (answer) {
                            if (answer != "false") {
                                answer = JSON.parse(answer);
                                for (let obj of answer) {
                                    let m = new KDMessage(obj["destination"], obj["payload"], obj["origin"], obj["producer"], obj["consumer"], obj["date"]);
                                    kernel.sendLocalMessage(m);
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

    /** Send messages to local registred applications */
    sendLocalMessage(message) {
        var re = new RegExp(message.destination);
        this.applications.forEach(function (app) {
            if (re.test(app.id))
                app.processMessage(message);
        });
        return this;
    }

    sendRemoteMessage(message, success_callback, error_callback) {
        let data = new FormData();
        data.append(this.messageSymbol, message.toString())
        let server = new KDServerBridge(this.serverUrl, data, success_callback, error_callback);
        server.request();
        return this;
    }

    constainsApplication(id) {
        for (let app of this.applications) {
            if (app.id == id) return true;
        }
        return false;
    }

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

/** Application base class */
class KDApplication extends KDObject {
    constructor(kernel) {
        super();

        /** Application identifier */
        this.id = this.constructor.name;

        /** Reference to kernel  */
        this.kernel = kernel;

        this.status = KDApplicationStatus.STOPPED;
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

/** User class wrapper */
class KDUser {
    constructor(name, organization) {
        this.name = name == undefined ? "guess" : name;
        this.organization = organization == undefined ? "generic" : organization;
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
        return this;
    }


}

function kdUser(fullName) {
    let name = fullName.substr(0, fullName.indexOf("@"));
    let organization = fullName.substr(name.length + 1);
    return new KDUser(name, organization);
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
}



class KDWindowDefaultTheme extends KDObject {
    constructor(properties) {
        super(
            {
                style: {
                    position: "absolute",
                    display: "inline-block",
                    border: "1px solid black",
                    height: "40vh",
                    width: "50vw",
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
                        }
                    },
                },

                body: {
                    style: {
                        position: "inherit",
                        display: "inherit",
                        border: "inherit",
                        height: "calc(100% - 80px)",
                        width: "calc(100% - 8px)",
                        left: "-1px",
                        top: "40px",
                        backgroundColor: "white",
                        overflow: "scroll",
                        fontSize: "1em",
                        padding: "4px",
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
            }
        }
    }
);


function kdWindow(theme) {
    if (theme == undefined) {
        theme = kdWindowDefaultTheme;
    }
    //return new KDWindow(theme.main, theme.head, theme.body, theme.foot);
    return new KDWindow(theme);
}


/** Area of functional applications */
class KDEval extends KDApplication {
    constructor(kernel) {
        super(kernel);
        this.id = "eval";
    }

    processMessage(message) {
        if (message.destination == this.id) {
            if (message.payload == "") {
                this.kernel.sendLocalMessage(kdMessage("terminal", "release", "KDEval"));
            } else {
                let r = " = " + eval(message.payload);
                this.kernel.sendLocalMessage(kdMessage("terminal", r, "KDEval"));
            }
        }
    }
}

/** Area of functional applications */
class KDAlert extends KDApplication {
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

/*
class KDServerInterface extends KDApplication {
    constructor(kernel) {
        super(kernel);
        this.id = "server";
    }

    processMessage(message) {
        let terminal = this.kernel.userInterfaceApplication;
        this.kernel.sendRemoteMessage(message, function (m) { terminal.appendText(m) });
    }

}
*/

class KDServerApp extends KDApplication {
    constructor(kernel) {
        super(kernel);
        this.id = "server";
    }
    processMessage(message) {
        if (message.destination == this.id) {
            // let consumer = message.reducePayload();
            // message.consumer = consumer;
            let theKernel = this.kernel;
            theKernel.sendRemoteMessage(
                message,
                theKernel.print
            )
        }
    }
}


class KDUserApp extends KDApplication {
    constructor(kernel) {
        super(kernel);
        this.id = "user";
    }

    processMessage(message) {
        if (message.destination == this.id) {
            let tokens = message.getTokens();
            switch (tokens[0]) {
                case "login":
                    let fullname = tokens[1];
                    let hashPassword = this.hash(tokens[2]);
                    let m = kdMessage("server",
                        "login " + fullname + " " + hashPassword,
                        this.id,
                        "",
                        ""
                    );
                    let theKernel = this.kernel;
                    this.kernel.sendRemoteMessage(m, function (answer) {
                        let obj = JSON.parse(answer);
                        if (obj.name) {
                            let u = new KDUser();
                            theKernel.currentUser = u.fromJson(answer);
                            let m = kdMessage("terminal", "print User loaded!\nPress enter.", this.id, theKernel.currentUser, theKernel.currentUser);
                            theKernel.sendLocalMessage(m);
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


class KDTerminal extends KDApplication {

    constructor(kernel) {
        super(kernel);
        this.window = undefined;
        this.id = "terminal";
        /** Mode like terminal open a waits for commands or messages */
        const MODE_NORMAL = 0;
        /**
         * When an application take priority and KDTerminal serve like user interface
         */
        const MODE_OWNED = 1;
        this.mode = this.MODE_NORMAL;
        this.owner = "";

        let it = this;
        kernel.print = function (t) { it.appendText(t, false) };
    }

    initializing() {
        this.window = new kdWindow(kdWindowTerminalTheme);
        this.window.body.setEditable(true);
        this.window.kernel = this.kernel;
        this.window.body.dom.terminal = this;
        this.window.body.dom.addEventListener("keypress", this.processKey);
        this.window.setTitle("Terminal");
    }

    run() {
        if (super.run()) {
            this.window.publish();
            this.appendText("");
        }
    }

    appendText(text, withPrefix) {
        if (withPrefix == undefined) { withPrefix = true; }
        let bodyNode = this.window.body.dom;
        let last = bodyNode.lastChild;
        bodyNode.focus();
        let node;
        if (withPrefix) {
            node = document.createTextNode("\n" + this.kernel.currentUser.fullName() + ":" + this.owner + ">" + text);
        } else {
            node = document.createTextNode("\n" + text);
        }
        bodyNode.appendChild(node, last);
        let s = window.getSelection();
        bodyNode.focus();
        s.collapse(node, node.textContent.length);
    }

    processMessage(message) {
        if (message.destination == this.id || message.destination == "!") {
            if (message.payload == undefined) {
                this.run();
            } else {
                let tokens = message.getTokens();
                switch (tokens[0]) {
                    case "take":
                        if (tokens.length > 1) {
                            let owner = tokens[1];
                            if (this.kernel.constainsApplication(owner)) {
                                this.owner = tokens[1];
                            }
                        }
                        break;

                    case "release":
                        this.owner = "";
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

                    default:
                        this.appendText(message.payload, true);
                        break;
                }
            }
        }
    }
    processKey(e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            let s = window.getSelection();
            let line = s.focusNode.textContent;
            line = line.substr(line.indexOf(">") + 1);
            let statements = line.split(";");

            for (let statement of statements) {
                let destination, payload;
                let firstSpace = statement.indexOf(" ");
                if (firstSpace == -1) { firstSpace = statement.length }
                if (e.target.terminal.owner == "") {
                    destination = statement.substr(0, firstSpace).trim();
                    payload = statement.substr(firstSpace).trim();
                } else {
                    destination = e.target.terminal.owner;
                    payload = statement.trim();
                }
                let message = new KDMessage(
                    destination,
                    payload,
                    "terminal",
                    e.target.terminal.kernel.currentUser.fullName(),
                    KD_ALL
                );
                e.target.terminal.kernel.sendLocalMessage(message);
            }
            e.target.terminal.appendText("");
        }
    }




}


/** Main instance of KERNEL. Must be after defaults applications */
var kdKernel = new KDKernel();
kdKernel
    .addApplication(KDTerminal)
    .addApplication(KDAlert)
    .addApplication(KDServerApp)
    .addApplication(KDUserApp)
    .addApplication(KDHashApp)
    .addApplication(KDEval)
    .initialize();




