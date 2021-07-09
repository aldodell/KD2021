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

        this.eventHandlers = [];

    }

    publish(comp) {
        if (comp == undefined) {
            comp = {};
            comp.dom = document.getElementsByTagName("body")[0];
        }

        comp.dom.appendChild(this.dom);
        return this;
    }


    setValue(value) {
        this.dom.value = value;
        return this;
    }

    clone() {
        let o = super.clone();
        o.dom = this.dom.cloneNode(false);
        o.dom.setAttribute("id", o.id);
        o.attachEvents(this.eventHandlers);
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
    }

}


class KDVisualComponent extends KDComponent {
    constructor(properties, htmlClass, htmlType) {
        super(properties, htmlClass, htmlType);
    }

    setStyle(name, value) {
        this.dom.style[name] = value;
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
                    this.components.push(comp);
                    this.dom.appendChild(comp.dom);
                }
            } else {
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


class KDLayer extends KDVisualContainerComponent {
    constructor(properties, htmlClass) {
        super(properties, "div");
    }
}

function kdLayer(properties) {
    return new KDLayer(properties);
}