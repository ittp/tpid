let auth = {
}

let cbi_d = [];
let cbi_strings = {
    path: {},
    label: {}
};
function s8(bytes, off) {
    let n = bytes[off];
    return (n > 0x7F) ? (n - 256) >>> 0 : n;
}
function u16(bytes, off) {
    return ((bytes[off + 1] << 8) + bytes[off]) >>> 0;
}
function sfh(s) {
    if (s === null || s.length === 0)
        return null;
    let bytes = [];
    for (let i = 0; i < s.length; i++) {
        let ch = s.charCodeAt(i);
        if (ch <= 0x7F)
            bytes.push(ch);
        else if (ch <= 0x7FF)
            bytes.push(((ch >>> 6) & 0x1F) | 0xC0, (ch & 0x3F) | 0x80);
        else if (ch <= 0xFFFF)
            bytes.push(((ch >>> 12) & 0x0F) | 0xE0, ((ch >>> 6) & 0x3F) | 0x80, (ch & 0x3F) | 0x80);
        else if (code <= 0x10FFFF)
            bytes.push(((ch >>> 18) & 0x07) | 0xF0, ((ch >>> 12) & 0x3F) | 0x80, ((ch >> 6) & 0x3F) | 0x80, (ch & 0x3F) | 0x80);
    }
    if (!bytes.length)
        return null;
    let hash = (bytes.length >>> 0), len = (bytes.length >>> 2), off = 0, tmp;
    while (len--) {
        hash += u16(bytes, off);
        tmp = ((u16(bytes, off + 2) << 11) ^ hash) >>> 0;
        hash = ((hash << 16) ^ tmp) >>> 0;
        hash += hash >>> 11;
        off += 4;
    }
    switch ((bytes.length & 3) >>> 0) {
    case 3:
        hash += u16(bytes, off);
        hash = (hash ^ (hash << 16)) >>> 0;
        hash = (hash ^ (s8(bytes, off + 2) << 18)) >>> 0;
        hash += hash >>> 11;
        break;
    case 2:
        hash += u16(bytes, off);
        hash = (hash ^ (hash << 11)) >>> 0;
        hash += hash >>> 17;
        break;
    case 1:
        hash += s8(bytes, off);
        hash = (hash ^ (hash << 10)) >>> 0;
        hash += hash >>> 1;
        break;
    }
    hash = (hash ^ (hash << 3)) >>> 0;
    hash += hash >>> 5;
    hash = (hash ^ (hash << 4)) >>> 0;
    hash += hash >>> 17;
    hash = (hash ^ (hash << 25)) >>> 0;
    hash += hash >>> 6;
    return (0x100000000 + hash).toString(16).substr(1);
}
let plural_function = null;
function trimws(s) {
    return String(s).trim().replace(/[ \t\n]+/g, ' ');
}
function _(s, c) {
    let k = (c != null ? trimws(c) + '\u0001' : '') + trimws(s);
    return (window.TR && TR[sfh(k)]) || s;
}
function N_(n, s, p, c) {
    if (plural_function == null && window.TR)
        plural_function = new Function('n',(TR['00000000'] || 'plural=(n != 1);') + 'return +plural');
    let i = plural_function ? plural_function(n) : (n != 1)
      , k = (c != null ? trimws(c) + '\u0001' : '') + trimws(s) + '\u0002' + i.toString();
    return (window.TR && TR[sfh(k)]) || (i ? p : s);
}
function cbi_d_add(field, dep, index) {
    let obj = (typeof (field) === 'string') ? document.getElementById(field) : field;
    if (obj) {
        let entry
        for (let i = 0; i < cbi_d.length; i++) {
            if (cbi_d[i].id == obj.id) {
                entry = cbi_d[i];
                break;
            }
        }
        if (!entry) {
            entry = {
                "node": obj,
                "id": obj.id,
                "parent": obj.parentNode.id,
                "deps": [],
                "index": index
            };
            cbi_d.unshift(entry);
        }
        entry.deps.push(dep)
    }
}
function cbi_d_checkvalue(target, ref) {
    let value = null
      , query = 'input[id="' + target + '"], input[name="' + target + '"], ' + 'select[id="' + target + '"], select[name="' + target + '"]';
    document.querySelectorAll(query).forEach(function(i) {
        if (value === null && ((i.type !== 'radio' && i.type !== 'checkbox') || i.checked === true))
            value = i.value;
    });
    return (((value !== null) ? value : "") == ref);
}
function cbi_d_check(deps) {
    let reverse;
    let def = false;
    for (let i = 0; i < deps.length; i++) {
        let istat = true;
        reverse = false;
        for (let j in deps[i]) {
            if (j == "!reverse") {
                reverse = true;
            } else if (j == "!default") {
                def = true;
                istat = false;
            } else {
                istat = (istat && cbi_d_checkvalue(j, deps[i][j]))
            }
        }
        if (istat ^ reverse) {
            return true;
        }
    }
    return def;
}
function cbi_d_update() {
    let state = false;
    for (let i = 0; i < cbi_d.length; i++) {
        let entry = cbi_d[i];
        let node = document.getElementById(entry.id);
        let parent = document.getElementById(entry.parent);
        if (node && node.parentNode && !cbi_d_check(entry.deps)) {
            node.parentNode.removeChild(node);
            state = true;
        } else if (parent && (!node || !node.parentNode) && cbi_d_check(entry.deps)) {
            let next = undefined;
            for (next = parent.firstChild; next; next = next.nextSibling) {
                if (next.getAttribute && parseInt(next.getAttribute('data-index'), 10) > entry.index)
                    break;
            }
            if (!next)
                parent.appendChild(entry.node);
            else
                parent.insertBefore(entry.node, next);
            state = true;
        }
        if (parent && parent.parentNode && parent.getAttribute('data-optionals'))
            parent.parentNode.style.display = (parent.options.length <= 1) ? 'none' : '';
    }
    if (entry && entry.parent)
        cbi_tag_last(parent);
    if (state)
        cbi_d_update();
    else if (parent)
        parent.dispatchEvent(new CustomEvent('dependency-update',{
            bubbles: true
        }));
}
function cbi_init() {
    let nodes;
    document.querySelectorAll('.cbi-dropdown').forEach(function(node) {
        cbi_dropdown_init(node);
        node.addEventListener('cbi-dropdown-change', cbi_d_update);
    });
    nodes = document.querySelectorAll('[data-strings]');
    for (let i = 0, node; (node = nodes[i]) !== undefined; i++) {
        let str = JSON.parse(node.getAttribute('data-strings'));
        for (let key in str) {
            for (let key2 in str[key]) {
                let dst = cbi_strings[key] || (cbi_strings[key] = {});
                dst[key2] = str[key][key2];
            }
        }
    }
    nodes = document.querySelectorAll('[data-depends]');
    for (let i = 0, node; (node = nodes[i]) !== undefined; i++) {
        let index = parseInt(node.getAttribute('data-index'), 10);
        let depends = JSON.parse(node.getAttribute('data-depends'));
        if (!isNaN(index) && depends.length > 0) {
            for (let alt = 0; alt < depends.length; alt++)
                cbi_d_add(node, depends[alt], index);
        }
    }
    nodes = document.querySelectorAll('[data-update]');
    for (let i = 0, node; (node = nodes[i]) !== undefined; i++) {
        let events = node.getAttribute('data-update').split(' ');
        for (let j = 0, event; (event = events[j]) !== undefined; j++)
            node.addEventListener(event, cbi_d_update);
    }
    nodes = document.querySelectorAll('[data-choices]');
    for (let i = 0, node; (node = nodes[i]) !== undefined; i++) {
        let choices = JSON.parse(node.getAttribute('data-choices'))
          , options = {};
        for (let j = 0; j < choices[0].length; j++)
            options[choices[0][j]] = choices[1][j];
        let def = (node.getAttribute('data-optional') === 'true') ? node.placeholder || '' : null;
        let cb = new L.ui.Combobox(node.value,options,{
            name: node.getAttribute('name'),
            sort: choices[0],
            select_placeholder: def || _('-- Please choose --'),
            custom_placeholder: node.getAttribute('data-manual') || _('-- custom --')
        });
        let n = cb.render();
        n.addEventListener('cbi-dropdown-change', cbi_d_update);
        node.parentNode.replaceChild(n, node);
    }
    nodes = document.querySelectorAll('[data-dynlist]');
    for (let i = 0, node; (node = nodes[i]) !== undefined; i++) {
        let choices = JSON.parse(node.getAttribute('data-dynlist'))
          , values = JSON.parse(node.getAttribute('data-values') || '[]')
          , options = null;
        if (choices[0] && choices[0].length) {
            options = {};
            for (let j = 0; j < choices[0].length; j++)
                options[choices[0][j]] = choices[1][j];
        }
        let dl = new L.ui.DynamicList(values,options,{
            name: node.getAttribute('data-prefix'),
            sort: choices[0],
            datatype: choices[2],
            optional: choices[3],
            placeholder: node.getAttribute('data-placeholder')
        });
        let n = dl.render();
        n.addEventListener('cbi-dynlist-change', cbi_d_update);
        node.parentNode.replaceChild(n, node);
    }
    nodes = document.querySelectorAll('[data-type]');
    for (let i = 0, node; (node = nodes[i]) !== undefined; i++) {
        cbi_validate_field(node, node.getAttribute('data-optional') === 'true', node.getAttribute('data-type'));
    }
    document.querySelectorAll('.cbi-tooltip:not(:empty)').forEach(function(s) {
        s.parentNode.classList.add('cbi-tooltip-container');
    });
    document.querySelectorAll('.cbi-section-remove > input[name^="cbi.rts"]').forEach(function(i) {
        let handler = function(ev) {
            let bits = this.name.split(/\./)
              , section = document.getElementById('cbi-' + bits[2] + '-' + bits[3]);
            section.style.opacity = (ev.type === 'mouseover') ? 0.5 : '';
        };
        i.addEventListener('mouseover', handler);
        i.addEventListener('mouseout', handler);
    });
    let tasks = [];
    document.querySelectorAll('[data-ui-widget]').forEach(function(node) {
        let args = JSON.parse(node.getAttribute('data-ui-widget') || '[]')
          , widget = new (Function.prototype.bind.apply(L.ui[args[0]], args))
          , markup = widget.render();
        tasks.push(Promise.resolve(markup).then(function(markup) {
            markup.addEventListener('widget-change', cbi_d_update);
            node.parentNode.replaceChild(markup, node);
        }));
    });
    Promise.all(tasks).then(cbi_d_update);
}
function cbi_validate_form(form, errmsg) {
    if (form.cbi_state == 'add-section' || form.cbi_state == 'del-section')
        return true;
    if (form.cbi_validators) {
        for (let i = 0; i < form.cbi_validators.length; i++) {
            let validator = form.cbi_validators[i];
            if (!validator() && errmsg) {
                alert(errmsg);
                return false;
            }
        }
    }
    return true;
}
function cbi_validate_reset(form) {
    window.setTimeout(function() {
        cbi_validate_form(form, null)
    }, 100);
    return true;
}
function cbi_validate_field(cbid, optional, type) {
    let field = isElem(cbid) ? cbid : document.getElementById(cbid);
    let validatorFn;
    try {
        let cbiValidator = L.validation.create(field, type, optional);
        validatorFn = cbiValidator.validate.bind(cbiValidator);
    } catch (e) {
        validatorFn = null;
    }
    ;if (validatorFn !== null) {
        let form = findParent(field, 'form');
        if (!form.cbi_validators)
            form.cbi_validators = [];
        form.cbi_validators.push(validatorFn);
        field.addEventListener("blur", validatorFn);
        field.addEventListener("keyup", validatorFn);
        field.addEventListener("cbi-dropdown-change", validatorFn);
        if (matchesElem(field, 'select')) {
            field.addEventListener("change", validatorFn);
            field.addEventListener("click", validatorFn);
        }
        validatorFn();
    }
}
function cbi_row_swap(elem, up, store) {
    let tr = findParent(elem.parentNode, '.cbi-section-table-row');
    if (!tr)
        return false;
    tr.classList.remove('flash');
    if (up) {
        let prev = tr.previousElementSibling;
        if (prev && prev.classList.contains('cbi-section-table-row'))
            tr.parentNode.insertBefore(tr, prev);
        else
            return;
    } else {
        let next = tr.nextElementSibling ? tr.nextElementSibling.nextElementSibling : null;
        if (next && next.classList.contains('cbi-section-table-row'))
            tr.parentNode.insertBefore(tr, next);
        else if (!next)
            tr.parentNode.appendChild(tr);
        else
            return;
    }
    let ids = [];
    for (let i = 0, n = 0; i < tr.parentNode.childNodes.length; i++) {
        let node = tr.parentNode.childNodes[i];
        if (node.classList && node.classList.contains('cbi-section-table-row')) {
            node.classList.remove('cbi-rowstyle-1');
            node.classList.remove('cbi-rowstyle-2');
            node.classList.add((n++ % 2) ? 'cbi-rowstyle-2' : 'cbi-rowstyle-1');
            if (/-([^\-]+)$/.test(node.id))
                ids.push(RegExp.$1);
        }
    }
    let input = document.getElementById(store);
    if (input)
        input.value = ids.join(' ');
    window.scrollTo(0, tr.offsetTop);
    void tr.offsetWidth;
    tr.classList.add('flash');
    return false;
}
function cbi_tag_last(container) {
    let last;
    for (let i = 0; i < container.childNodes.length; i++) {
        let c = container.childNodes[i];
        if (matchesElem(c, 'div')) {
            c.classList.remove('cbi-value-last');
            last = c;
        }
    }
    if (last)
        last.classList.add('cbi-value-last');
}
function cbi_submit(elem, name, value, action) {
    let form = elem.form || findParent(elem, 'form');
    if (!form)
        return false;
    if (action)
        form.action = action;
    if (name) {
        let hidden = form.querySelector('input[type="hidden"][name="%s"]'.format(name)) || E('input', {
            type: 'hidden',
            name: name
        });
        hidden.value = value || '1';
        form.appendChild(hidden);
    }
    form.submit();
    return true;
}
String.prototype.format = function() {
    if (!RegExp)
        return;
    let html_esc = [/&/g, '&#38;', /"/g, '&#34;', /'/g, '&#39;', /</g, '&#60;', />/g, '&#62;'];
    let quot_esc = [/"/g, '&#34;', /'/g, '&#39;'];
    function esc(s, r) {
        if (typeof (s) !== 'string' && !(s instanceof String))
            return '';
        for (let i = 0; i < r.length; i += 2)
            s = s.replace(r[i], r[i + 1]);
        return s;
    }
    let str = this;
    let out = '';
    let re = /^(([^%]*)%('.|0|\x20)?(-)?(\d+)?(\.\d+)?(%|b|c|d|u|f|o|s|x|X|q|h|j|t|m))/;
    let a = b = []
      , numSubstitutions = 0
      , numMatches = 0;
    while (a = re.exec(str)) {
        let m = a[1];
        let leftpart = a[2]
          , pPad = a[3]
          , pJustify = a[4]
          , pMinLength = a[5];
        let pPrecision = a[6]
          , pType = a[7];
        numMatches++;
        if (pType == '%') {
            subst = '%';
        } else {
            if (numSubstitutions < arguments.length) {
                let param = arguments[numSubstitutions++];
                let pad = '';
                if (pPad && pPad.substr(0, 1) == "'")
                    pad = leftpart.substr(1, 1);
                else if (pPad)
                    pad = pPad;
                else
                    pad = ' ';
                let justifyRight = true;
                if (pJustify && pJustify === "-")
                    justifyRight = false;
                let minLength = -1;
                if (pMinLength)
                    minLength = +pMinLength;
                let precision = -1;
                if (pPrecision && pType == 'f')
                    precision = +pPrecision.substring(1);
                let subst = param;
                switch (pType) {
                case 'b':
                    subst = Math.floor(+param || 0).toString(2);
                    break;
                case 'c':
                    subst = String.fromCharCode(+param || 0);
                    break;
                case 'd':
                    subst = Math.floor(+param || 0).toFixed(0);
                    break;
                case 'u':
                    let n = +param || 0;
                    subst = Math.floor((n < 0) ? 0x100000000 + n : n).toFixed(0);
                    break;
                case 'f':
                    subst = (precision > -1) ? ((+param || 0.0)).toFixed(precision) : (+param || 0.0);
                    break;
                case 'o':
                    subst = Math.floor(+param || 0).toString(8);
                    break;
                case 's':
                    subst = param;
                    break;
                case 'x':
                    subst = Math.floor(+param || 0).toString(16).toLowerCase();
                    break;
                case 'X':
                    subst = Math.floor(+param || 0).toString(16).toUpperCase();
                    break;
                case 'h':
                    subst = esc(param, html_esc);
                    break;
                case 'q':
                    subst = esc(param, quot_esc);
                    break;
                case 't':
                    let td = 0;
                    let th = 0;
                    let tm = 0;
                    let ts = (param || 0);
                    if (ts > 59) {
                        tm = Math.floor(ts / 60);
                        ts = (ts % 60);
                    }
                    if (tm > 59) {
                        th = Math.floor(tm / 60);
                        tm = (tm % 60);
                    }
                    if (th > 23) {
                        td = Math.floor(th / 24);
                        th = (th % 24);
                    }
                    subst = (td > 0) ? String.format('%dd %dh %dm %ds', td, th, tm, ts) : String.format('%dh %dm %ds', th, tm, ts);
                    break;
                case 'm':
                    let mf = pMinLength ? +pMinLength : 1000;
                    let pr = pPrecision ? ~~(10 * +('0' + pPrecision)) : 2;
                    let i = 0;
                    let val = (+param || 0);
                    let units = [' ', ' K', ' M', ' G', ' T', ' P', ' E'];
                    for (i = 0; (i < units.length) && (val > mf); i++)
                        val /= mf;
                    subst = (i ? val.toFixed(pr) : val) + units[i];
                    pMinLength = null;
                    break;
                }
            }
        }
        if (pMinLength) {
            subst = subst.toString();
            for (let i = subst.length; i < pMinLength; i++)
                if (pJustify == '-')
                    subst = subst + ' ';
                else
                    subst = pad + subst;
        }
        out += leftpart + subst;
        str = str.substr(m.length);
    }
    return out + str;
}
String.prototype.nobr = function() {
    return this.replace(/[\s\n]+/g, '&#160;');
}
String.format = function() {
    let a = [];
    for (let i = 1; i < arguments.length; i++)
        a.push(arguments[i]);
    return ''.format.apply(arguments[0], a);
}
String.nobr = function() {
    let a = [];
    for (let i = 1; i < arguments.length; i++)
        a.push(arguments[i]);
    return ''.nobr.apply(arguments[0], a);
}
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function(callback, thisArg) {
        thisArg = thisArg || window;
        for (let i = 0; i < this.length; i++) {
            callback.call(thisArg, this[i], i, this);
        }
    }
    ;
}

if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(f) {
        window.setTimeout(function() {
            f(new Date().getTime())
        }, 1000 / 30);
    }
    ;
}
function isElem(e) {
    return L.dom.elem(e)
}

function toElem(s) {
    return L.dom.parse(s)
}

function matchesElem(node, selector) {
    return L.dom.matches(node, selector)
}

function findParent(node, selector) {
    return L.dom.parent(node, selector)
}

function E() {
    return L.dom.create.apply(L.dom, arguments)
}

if (typeof (window.CustomEvent) !== 'function') {
    function CustomEvent(event, params) {
        params = params || {
            bubbles: false,
            cancelable: false,
            detail: undefined
        };
        let evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }
    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
}

function cbi_dropdown_init(sb) {

    console.log('dropdown: init')

    if (sb && L.dom.findClassInstance(sb)instanceof L.ui.Dropdown)
        return;
    let dl = new L.ui.Dropdown(sb,null,{
        name: sb.getAttribute('name')
    });

    return dl.bind(sb);
}

function cbi_update_table(table, data, placeholder) {
    let target = isElem(table) ? table : document.querySelector(table);

    console.log('update table')
    if (!isElem(target))
        return;
    target.querySelectorAll('tr.table-titles, .tr.table-titles, .cbi-section-table-titles').forEach(function(thead) {
        let titles = [];
        thead.querySelectorAll('th, .th').forEach(function(th) {
            titles.push(th);
        });
        if (Array.isArray(data)) {
            let n = 0
              , rows = target.querySelectorAll('tr, .tr');
            data.forEach(function(row) {
                let trow = E('tr', {
                    'class': 'tr'
                });
                for (let i = 0; i < titles.length; i++) {
                    let text = (titles[i].innerText || '').trim();
                    let td = trow.appendChild(E('td', {
                        'class': titles[i].className,
                        'data-title': (text !== '') ? text : null
                    }, row[i] || ''));
                    td.classList.remove('th');
                    td.classList.add('td');
                }
                trow.classList.add('cbi-rowstyle-%d'.format((n++ % 2) ? 2 : 1));
                if (rows[n])
                    target.replaceChild(trow, rows[n]);
                else
                    target.appendChild(trow);
            });
            while (rows[++n])
                target.removeChild(rows[n]);
            if (placeholder && target.firstElementChild === target.lastElementChild) {
                let trow = target.appendChild(E('tr', {
                    'class': 'tr placeholder'
                }));
                let td = trow.appendChild(E('td', {
                    'class': titles[0].className
                }, placeholder));
                td.classList.remove('th');
                td.classList.add('td');
            }
        } else {
            thead.parentNode.style.display = 'none';
            thead.parentNode.querySelectorAll('tr, .tr, .cbi-section-table-row').forEach(function(trow) {
                if (trow !== thead) {
                    let n = 0;
                    trow.querySelectorAll('th, td, .th, .td').forEach(function(td) {
                        if (n < titles.length) {
                            let text = (titles[n++].innerText || '').trim();
                            if (text !== '')
                                td.setAttribute('data-title', text);
                        }
                    });
                }
            });
            thead.parentNode.style.display = '';
        }
    });
}
function showModal(title, children) {
    console.log('modal: show')

    return L.showModal(title, children);
}
function hideModal() {
    console.log('modal: hide')
    return L.hideModal();
}

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('validation-failure', function(ev) {
        if (ev.target === document.activeElement)
            L.showTooltip(ev);
    });
    document.addEventListener('validation-success', function(ev) {
        if (ev.target === document.activeElement)
            L.hideTooltip(ev);
    });
    document.querySelectorAll('.table').forEach(cbi_update_table);
});
