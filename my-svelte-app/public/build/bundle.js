
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function split_css_unit(value) {
        const split = typeof value === 'string' && value.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
        return split ? [parseFloat(split[1]), split[2] || 'px'] : [value, 'px'];
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Schedules a callback to run immediately after the component has been updated.
     *
     * The first time the callback runs will be after the initial `onMount`
     */
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    /**
     * Schedules a callback to run immediately before the component is unmounted.
     *
     * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
     * only one that runs inside a server-side component.
     *
     * https://svelte.dev/docs#run-time-svelte-ondestroy
     */
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        const options = { direction: 'in' };
        let config = fn(node, params, options);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config(options);
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        const options = { direction: 'both' };
        let config = fn(node, params, options);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config(options);
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    function construct_svelte_component_dev(component, props) {
        const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
        try {
            const instance = new component(props);
            if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
                throw new Error(error_message);
            }
            return instance;
        }
        catch (err) {
            const { message } = err;
            if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
                throw new Error(error_message);
            }
            else {
                throw err;
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Navigation.svelte generated by Svelte v3.59.2 */

    const file$4 = "src/components/Navigation.svelte";

    function create_fragment$6(ctx) {
    	let nav;
    	let div;
    	let a0;
    	let t1;
    	let button;
    	let span0;
    	let t2;
    	let span1;
    	let t3;
    	let span2;
    	let t4;
    	let ul;
    	let li0;
    	let a1;
    	let t6;
    	let li1;
    	let a2;
    	let t8;
    	let li2;
    	let a3;
    	let t10;
    	let li3;
    	let a4;
    	let ul_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div = element("div");
    			a0 = element("a");
    			a0.textContent = "Tier-Quiz – Enes Cilingir";
    			t1 = space();
    			button = element("button");
    			span0 = element("span");
    			t2 = space();
    			span1 = element("span");
    			t3 = space();
    			span2 = element("span");
    			t4 = space();
    			ul = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			a1.textContent = "Home";
    			t6 = space();
    			li1 = element("li");
    			a2 = element("a");
    			a2.textContent = "Quiz";
    			t8 = space();
    			li2 = element("li");
    			a3 = element("a");
    			a3.textContent = "Datenbank";
    			t10 = space();
    			li3 = element("li");
    			a4 = element("a");
    			a4.textContent = "Highscores";
    			attr_dev(a0, "href", "#/");
    			attr_dev(a0, "class", "svelte-7vw3z5");
    			add_location(a0, file$4, 10, 4, 152);
    			attr_dev(div, "class", "nav-brand svelte-7vw3z5");
    			add_location(div, file$4, 9, 2, 124);
    			attr_dev(span0, "class", "bar svelte-7vw3z5");
    			add_location(span0, file$4, 13, 4, 303);
    			attr_dev(span1, "class", "bar svelte-7vw3z5");
    			add_location(span1, file$4, 14, 4, 333);
    			attr_dev(span2, "class", "bar svelte-7vw3z5");
    			add_location(span2, file$4, 15, 4, 363);
    			attr_dev(button, "class", "nav-toggle svelte-7vw3z5");
    			attr_dev(button, "aria-label", "Menü umschalten");
    			attr_dev(button, "type", "button");
    			add_location(button, file$4, 12, 2, 206);
    			attr_dev(a1, "href", "#/");
    			attr_dev(a1, "class", "svelte-7vw3z5");
    			add_location(a1, file$4, 18, 8, 461);
    			add_location(li0, file$4, 18, 4, 457);
    			attr_dev(a2, "href", "#/quiz");
    			attr_dev(a2, "class", "svelte-7vw3z5");
    			add_location(a2, file$4, 19, 8, 496);
    			add_location(li1, file$4, 19, 4, 492);
    			attr_dev(a3, "href", "#/database");
    			attr_dev(a3, "class", "svelte-7vw3z5");
    			add_location(a3, file$4, 20, 8, 535);
    			add_location(li2, file$4, 20, 4, 531);
    			attr_dev(a4, "href", "#/highscores");
    			attr_dev(a4, "class", "svelte-7vw3z5");
    			add_location(a4, file$4, 21, 8, 583);
    			add_location(li3, file$4, 21, 4, 579);
    			attr_dev(ul, "class", ul_class_value = "nav-links " + (/*showMenu*/ ctx[0] ? 'active' : '') + " svelte-7vw3z5");
    			add_location(ul, file$4, 17, 2, 403);
    			attr_dev(nav, "class", "navbar svelte-7vw3z5");
    			add_location(nav, file$4, 8, 0, 101);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div);
    			append_dev(div, a0);
    			append_dev(nav, t1);
    			append_dev(nav, button);
    			append_dev(button, span0);
    			append_dev(button, t2);
    			append_dev(button, span1);
    			append_dev(button, t3);
    			append_dev(button, span2);
    			append_dev(nav, t4);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a1);
    			append_dev(ul, t6);
    			append_dev(ul, li1);
    			append_dev(li1, a2);
    			append_dev(ul, t8);
    			append_dev(ul, li2);
    			append_dev(li2, a3);
    			append_dev(ul, t10);
    			append_dev(ul, li3);
    			append_dev(li3, a4);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*toggleMenu*/ ctx[1], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*showMenu*/ 1 && ul_class_value !== (ul_class_value = "nav-links " + (/*showMenu*/ ctx[0] ? 'active' : '') + " svelte-7vw3z5")) {
    				attr_dev(ul, "class", ul_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navigation', slots, []);
    	let showMenu = false;

    	function toggleMenu() {
    		$$invalidate(0, showMenu = !showMenu);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navigation> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ showMenu, toggleMenu });

    	$$self.$inject_state = $$props => {
    		if ('showMenu' in $$props) $$invalidate(0, showMenu = $$props.showMenu);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showMenu, toggleMenu];
    }

    class Navigation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navigation",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier} [start]
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let started = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (started) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            started = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
                // We need to set this to false because callbacks can still happen despite having unsubscribed:
                // Callbacks might already be placed in the queue which doesn't know it should no longer
                // invoke this derived store.
                started = false;
            };
        });
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.59.2 */

    const { Error: Error_1, Object: Object_1, console: console_1$3 } = globals;

    // (246:0) {:else}
    function create_else_block$3(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (dirty & /*component*/ 1 && switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(246:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (239:0) {#if componentParams}
    function create_if_block$3(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (dirty & /*component*/ 1 && switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(239:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getLocation() {
    	const hashPosition = window.location.href.indexOf('#/');

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: '/';

    	// Check if there's a querystring
    	const qsPosition = location.indexOf('?');

    	let querystring = '';

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener('hashchange', update, false);

    	return function stop() {
    		window.removeEventListener('hashchange', update, false);
    	};
    });

    const location = derived(loc, _loc => _loc.location);
    const querystring = derived(loc, _loc => _loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

    	try {
    		const newState = { ...history.state };
    		delete newState['__svelte_spa_router_scrollX'];
    		delete newState['__svelte_spa_router_scrollY'];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event('hashchange'));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
    		throw Error('Action "link" can only be used with <a> tags');
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    function restoreScroll(state) {
    	// If this exists, then this is a back navigation: restore the scroll position
    	if (state) {
    		window.scrollTo(state.__svelte_spa_router_scrollX, state.__svelte_spa_router_scrollY);
    	} else {
    		// Otherwise this is a forward navigation: scroll to top
    		window.scrollTo(0, 0);
    	}
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute('href');

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == '/') {
    		// Add # to the href attribute
    		href = '#' + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
    		throw Error('Invalid value for "href" attribute: ' + href);
    	}

    	node.setAttribute('href', href);

    	node.addEventListener('click', event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == 'string') {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = '' } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
    				throw Error('Invalid component object');
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
    				throw Error('Invalid value for "path" argument - strings must start with / or *');
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == 'object' && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == 'string') {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || '/';
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || '/';
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && (event.state.__svelte_spa_router_scrollY || event.state.__svelte_spa_router_scrollX)) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener('popstate', popStateChanged);

    		afterUpdate(() => {
    			restoreScroll(previousScrollState);
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == 'object' && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick('conditionsFailed', detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoading', Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == 'object' && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener('popstate', popStateChanged);
    	});

    	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		restoreScroll,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ('props' in $$props) $$invalidate(2, props = $$props.props);
    		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
    		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
    		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
    		if ('componentObj' in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        const [xValue, xUnit] = split_css_unit(x);
        const [yValue, yUnit] = split_css_unit(y);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * xValue}${xUnit}, ${(1 - t) * yValue}${yUnit});
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut, axis = 'y' } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const primary_property = axis === 'y' ? 'height' : 'width';
        const primary_property_value = parseFloat(style[primary_property]);
        const secondary_properties = axis === 'y' ? ['top', 'bottom'] : ['left', 'right'];
        const capitalized_secondary_properties = secondary_properties.map((e) => `${e[0].toUpperCase()}${e.slice(1)}`);
        const padding_start_value = parseFloat(style[`padding${capitalized_secondary_properties[0]}`]);
        const padding_end_value = parseFloat(style[`padding${capitalized_secondary_properties[1]}`]);
        const margin_start_value = parseFloat(style[`margin${capitalized_secondary_properties[0]}`]);
        const margin_end_value = parseFloat(style[`margin${capitalized_secondary_properties[1]}`]);
        const border_width_start_value = parseFloat(style[`border${capitalized_secondary_properties[0]}Width`]);
        const border_width_end_value = parseFloat(style[`border${capitalized_secondary_properties[1]}Width`]);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `${primary_property}: ${t * primary_property_value}px;` +
                `padding-${secondary_properties[0]}: ${t * padding_start_value}px;` +
                `padding-${secondary_properties[1]}: ${t * padding_end_value}px;` +
                `margin-${secondary_properties[0]}: ${t * margin_start_value}px;` +
                `margin-${secondary_properties[1]}: ${t * margin_end_value}px;` +
                `border-${secondary_properties[0]}-width: ${t * border_width_start_value}px;` +
                `border-${secondary_properties[1]}-width: ${t * border_width_end_value}px;`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    // src/data.js
    const animals = [
        { name: "Alligator", soundUrl: "AnimalSounds/Alligator.mp3" },
        { name: "Bär", soundUrl: "AnimalSounds/Bär.mp3" },
        { name: "Buckelwal", soundUrl: "AnimalSounds/Buckelwal.mp3" },
        { name: "Elch", soundUrl: "AnimalSounds/Elch.mp3" },
        { name: "Elefant", soundUrl: "AnimalSounds/Elefant.mp3" },
        { name: "Elster", soundUrl: "AnimalSounds/Elster.mp3" },
        { name: "Esel", soundUrl: "AnimalSounds/Esel.mp3" },
        { name: "Europäischer Falke", soundUrl: "AnimalSounds/Europäischer Falke.mp3" },
        { name: "Fledermaus", soundUrl: "AnimalSounds/Fledermaus.mp3" },
        { name: "Frosch", soundUrl: "AnimalSounds/Frosch.mp3" },
        { name: "Gans", soundUrl: "AnimalSounds/Gans.mp3" },
        { name: "Gecko", soundUrl: "AnimalSounds/Gecko.mp3" },
        { name: "Giraffe", soundUrl: "AnimalSounds/Giraffe.mp3" },
        { name: "Großer Dachs", soundUrl: "AnimalSounds/Großer Dachs.mp3" },
        { name: "Brachvogel", soundUrl: "AnimalSounds/Brachvogel.mp3" },
        { name: "Hahn", soundUrl: "AnimalSounds/Hahn.mp3" },
        { name: "Heuschrecke", soundUrl: "AnimalSounds/Heuschrecke.mp3" },
        { name: "Hummel", soundUrl: "AnimalSounds/Hummel.mp3" },
        { name: "Hyäne", soundUrl: "AnimalSounds/Hyäne.mp3" },
        { name: "Jägerliste", soundUrl: "AnimalSounds/Jägerliste.mp3" },
        { name: "Katze", soundUrl: "AnimalSounds/Katze.mp3" },
        { name: "Klapperschlange", soundUrl: "AnimalSounds/Klapperschlange.mp3" },
        { name: "Kranich", soundUrl: "AnimalSounds/Kranich.mp3" },
        { name: "Löwe", soundUrl: "AnimalSounds/Löwe.mp3" },
        { name: "Mantelbrüllaffe", soundUrl: "AnimalSounds/Mantelbrüllaffe.mp3" },
        { name: "Papagei", soundUrl: "AnimalSounds/Papagei.mp3" },
        { name: "Pferd", soundUrl: "AnimalSounds/Pferd.mp3" },
        { name: "Reh", soundUrl: "AnimalSounds/Reh.mp3" },
        { name: "Schaf", soundUrl: "AnimalSounds/Schaf.mp3" },
        { name: "Schlammrutschkuh", soundUrl: "AnimalSounds/Schlammrutschkuh.mp3" },
        { name: "Schwan", soundUrl: "AnimalSounds/Schwan.mp3" },
        { name: "Schwarzer Rabe", soundUrl: "AnimalSounds/Schwarzer Rabe.mp3" },
        { name: "Schwein", soundUrl: "AnimalSounds/Schwein.mp3" },
        { name: "Stieglitz", soundUrl: "AnimalSounds/Stieglitz.mp3" },
        { name: "Taube", soundUrl: "AnimalSounds/Taube.mp3" },
        { name: "Tiger", soundUrl: "AnimalSounds/Tiger.mp3" },
        { name: "Truthan", soundUrl: "AnimalSounds/Truthan.mp3" },
        { name: "Uhu", soundUrl: "AnimalSounds/Uhu.mp3" },
        { name: "Weißkopfseeadler", soundUrl: "AnimalSounds/Weißkopfseeadler.mp3" },
        { name: "Wolf", soundUrl: "AnimalSounds/Wolf.mp3" },
        { name: "Ziege", soundUrl: "AnimalSounds/Ziege.mp3" },
        { name: "Zikadenchor", soundUrl: "AnimalSounds/Zikadenchor.mp3" },
      ];

    // src/utils.js

    const translationMap = {
      schwein: "pig",
      klapperschlange: "rattlesnake",
      "europäischer falke": "falcon",
      elster: "magpie",
      hund: "dog",
      katze: "cat",
      pferd: "horse",
      kuh: "cow",
      alligator: "alligator",
      bär: "bear",
      buckelwal: "humpback whale",
      elch: "moose",
      elefant: "elephant",
      esel: "donkey",
      fledermaus: "bat",
      frosch: "frog",
      gans: "goose",
      gecko: "gecko",
      giraffe: "giraffe",
      "großer dachs": "badger",
      brachvogel: "curlew",
      hahn: "rooster",
      heuschrecke: "grasshopper",
      hummel: "bumblebee",
      hyäne: "hyena",
      jägerliste: "bird of prey",
      kranich: "crane bird",
      löwe: "lion",
      mantelbrüllaffe: "mantled howler monkey",
      papagei: "parrot",
      reh: "deer",
      schaf: "sheep",
      schlammrutschkuh: "mud cow",
      schwan: "swan",
      "schwarzer rabe": "black raven",
      stieglitz: "goldfinch",
      taube: "pigeon",
      tiger: "tiger",
      truthan: "turkey bird",
      uhu: "owl",
      weißkopfseeadler: "bald eagle",
      wolf: "wolf angry",
      ziege: "goat",
      zikadenchor: "cicada chorus"
    };

    function translateToEnglish(name) {
      const lower = name.trim().toLowerCase();
      return translationMap[lower] || name;
    }

    function shuffleArray(array) {
      let current = array.length;
      while (current) {
        const rand = Math.floor(Math.random() * current);
        current--;
        [array[current], array[rand]] = [array[rand], array[current]];
      }
      return array;
    }

    function getMimeType(url) {
      const lower = url.toLowerCase();
      if (lower.endsWith(".ogg")) return "audio/ogg";
      if (lower.endsWith(".wav")) return "audio/wav";
      if (lower.endsWith(".mp3")) return "audio/mpeg";
      return "audio/mpeg";
    }

    const UNSPLASH_API_KEY = "uxuvkKzsiw7h7-5VhanfMDYdC_JAFhdPFEJYgyBv_kQ"; // Setze hier deinen gültigen Unsplash API-Key ein

    async function fetchUnsplashImage(query) {
      try {
        const searchTerm = translateToEnglish(query);
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      searchTerm
    )}&per_page=1&orientation=landscape&client_id=${UNSPLASH_API_KEY}`;
        console.log("Requesting Unsplash URL:", url);
        const resp = await fetch(url);
        const data = await resp.json();
        console.log("Received Unsplash data:", data);
        if (data && data.results && data.results.length > 0) {
          return data.results[0].urls.small;
        }
      } catch (error) {
        console.error("Fehler beim Abrufen des Bildes:", error);
      }
      return "https://via.placeholder.com/300?text=No+Image";
    }

    async function fetchAnimalFunFact(name) {
      try {
        let wikiTitle = name;
        if (wikiTitle.toLowerCase() === "bär") {
          wikiTitle = "Bären";
        } else if (wikiTitle.toLowerCase() === "alligator") {
          wikiTitle = "Alligatoren";
        }
        const url = `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
        const resp = await fetch(url);
        if (!resp.ok) {
          throw new Error(`Wikipedia API error: ${resp.status}`);
        }
        const data = await resp.json();
        if (data && data.extract) {
          if (
            data.extract.includes("steht für:") ||
            data.extract.includes("Gattung") ||
            data.extract.includes("Liste von")
          ) {
            return `Wusstest du, dass ${name} ein wirklich faszinierendes Tier ist?`;
          }
          const sentences = data.extract.split(". ");
          if (sentences && sentences.length > 0) {
            const randomIndex = Math.floor(Math.random() * sentences.length);
            let sentence = sentences[randomIndex].trim();
            if (!sentence.endsWith(".")) {
              sentence += ".";
            }
            return sentence;
          }
        }
      } catch (error) {
        console.error("Fehler beim Abrufen des Fun Facts von Wikipedia für", name, error);
      }
      return `Wusstest du, dass ${name} ein wirklich faszinierendes Tier ist?`;
    }

    /* src/pages/Home.svelte generated by Svelte v3.59.2 */

    const { console: console_1$2 } = globals;
    const file$3 = "src/pages/Home.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    // (97:2) {#each backgroundAnimals as b}
    function create_each_block_1(ctx) {
    	let img;
    	let img_alt_value;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "alt", img_alt_value = /*b*/ ctx[16].name);
    			if (!src_url_equal(img.src, img_src_value = /*b*/ ctx[16].imageUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "floating-animal svelte-1bx74jv");
    			set_style(img, "top", /*b*/ ctx[16].y + "%");
    			set_style(img, "left", /*b*/ ctx[16].x + "%");
    			add_location(img, file$3, 97, 4, 3264);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*backgroundAnimals*/ 2 && img_alt_value !== (img_alt_value = /*b*/ ctx[16].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*backgroundAnimals*/ 2 && !src_url_equal(img.src, img_src_value = /*b*/ ctx[16].imageUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*backgroundAnimals*/ 2) {
    				set_style(img, "top", /*b*/ ctx[16].y + "%");
    			}

    			if (dirty & /*backgroundAnimals*/ 2) {
    				set_style(img, "left", /*b*/ ctx[16].x + "%");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(97:2) {#each backgroundAnimals as b}",
    		ctx
    	});

    	return block;
    }

    // (138:4) {#each galleryAnimals.slice(0, 6) as animal (animal.name)}
    function create_each_block$3(key_1, ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let h3;
    	let t1_value = /*animal*/ ctx[13].name + "";
    	let t1;
    	let t2;
    	let div1_intro;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*animal*/ ctx[13].imageUrl || "https://via.placeholder.com/300?text=Loading...")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*animal*/ ctx[13].name);
    			attr_dev(img, "class", "svelte-1bx74jv");
    			add_location(img, file$3, 139, 8, 4895);
    			attr_dev(h3, "class", "svelte-1bx74jv");
    			add_location(h3, file$3, 141, 10, 5041);
    			attr_dev(div0, "class", "card-overlay svelte-1bx74jv");
    			add_location(div0, file$3, 140, 8, 5004);
    			attr_dev(div1, "class", "gallery-card svelte-1bx74jv");
    			add_location(div1, file$3, 138, 6, 4825);
    			this.first = div1;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h3);
    			append_dev(h3, t1);
    			append_dev(div1, t2);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*galleryAnimals*/ 1 && !src_url_equal(img.src, img_src_value = /*animal*/ ctx[13].imageUrl || "https://via.placeholder.com/300?text=Loading...")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*galleryAnimals*/ 1 && img_alt_value !== (img_alt_value = /*animal*/ ctx[13].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*galleryAnimals*/ 1 && t1_value !== (t1_value = /*animal*/ ctx[13].name + "")) set_data_dev(t1, t1_value);
    		},
    		i: function intro(local) {
    			if (!div1_intro) {
    				add_render_callback(() => {
    					div1_intro = create_in_transition(div1, fly, { x: -50, duration: 500 });
    					div1_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(138:4) {#each galleryAnimals.slice(0, 6) as animal (animal.name)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div0;
    	let t0;
    	let section0;
    	let div2;
    	let h1;
    	let h1_intro;
    	let t2;
    	let p0;
    	let p0_intro;
    	let t4;
    	let div1;
    	let a0;
    	let button0;
    	let t6;
    	let a1;
    	let button1;
    	let div1_intro;
    	let t8;
    	let section1;
    	let h20;
    	let t10;
    	let div5;
    	let button2;
    	let t12;
    	let div4;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t13;
    	let div3;
    	let h30;

    	let t14_value = (/*featuredAnimal*/ ctx[2]
    	? /*featuredAnimal*/ ctx[2].name
    	: "") + "";

    	let t14;
    	let div4_intro;
    	let t15;
    	let button3;
    	let t17;
    	let section2;
    	let h21;
    	let t19;
    	let div6;
    	let each_blocks = [];
    	let each1_lookup = new Map();
    	let t20;
    	let section3;
    	let h22;
    	let t22;
    	let div10;
    	let div7;
    	let h31;
    	let t24;
    	let p1;
    	let div7_intro;
    	let t26;
    	let div8;
    	let h32;
    	let t28;
    	let p2;
    	let div8_intro;
    	let t30;
    	let div9;
    	let h33;
    	let t32;
    	let p3;
    	let div9_intro;
    	let t34;
    	let section4;
    	let h23;
    	let t36;
    	let p4;
    	let t38;
    	let form;
    	let input;
    	let t39;
    	let button4;
    	let t41;
    	let footer;
    	let p5;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*backgroundAnimals*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*galleryAnimals*/ ctx[0].slice(0, 6);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*animal*/ ctx[13].name;
    	validate_each_keys(ctx, each_value, get_each_context$3, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$3(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each1_lookup.set(key, each_blocks[i] = create_each_block$3(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			section0 = element("section");
    			div2 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Erlebe die Magie der Tierwelt";
    			t2 = space();
    			p0 = element("p");
    			p0.textContent = "Tauche ein in eine Welt voller faszinierender Kreaturen, atemberaubender Natur und unvergesslicher Abenteuer.";
    			t4 = space();
    			div1 = element("div");
    			a0 = element("a");
    			button0 = element("button");
    			button0.textContent = "Quiz starten";
    			t6 = space();
    			a1 = element("a");
    			button1 = element("button");
    			button1.textContent = "Datenbank erkunden";
    			t8 = space();
    			section1 = element("section");
    			h20 = element("h2");
    			h20.textContent = "Tier des Tages";
    			t10 = space();
    			div5 = element("div");
    			button2 = element("button");
    			button2.textContent = "❮";
    			t12 = space();
    			div4 = element("div");
    			img = element("img");
    			t13 = space();
    			div3 = element("div");
    			h30 = element("h3");
    			t14 = text(t14_value);
    			t15 = space();
    			button3 = element("button");
    			button3.textContent = "❯";
    			t17 = space();
    			section2 = element("section");
    			h21 = element("h2");
    			h21.textContent = "Galerie der Wunder";
    			t19 = space();
    			div6 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t20 = space();
    			section3 = element("section");
    			h22 = element("h2");
    			h22.textContent = "Wusstest du schon?";
    			t22 = space();
    			div10 = element("div");
    			div7 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Chamäleons";
    			t24 = space();
    			p1 = element("p");
    			p1.textContent = "Chamäleons können ihre Farbe ändern, um sich ihrer Umgebung anzupassen.";
    			t26 = space();
    			div8 = element("div");
    			h32 = element("h3");
    			h32.textContent = "Kolibris";
    			t28 = space();
    			p2 = element("p");
    			p2.textContent = "Kolibris sind die einzigen Vögel, die rückwärts fliegen können.";
    			t30 = space();
    			div9 = element("div");
    			h33 = element("h3");
    			h33.textContent = "Elefanten";
    			t32 = space();
    			p3 = element("p");
    			p3.textContent = "Elefanten besitzen ein beeindruckendes Gedächtnis und komplexe soziale Strukturen.";
    			t34 = space();
    			section4 = element("section");
    			h23 = element("h2");
    			h23.textContent = "Bleib auf dem Laufenden!";
    			t36 = space();
    			p4 = element("p");
    			p4.textContent = "Melde dich an, um regelmäßig spannende Fakten, Tipps und Neuigkeiten aus der Tierwelt zu erhalten.";
    			t38 = space();
    			form = element("form");
    			input = element("input");
    			t39 = space();
    			button4 = element("button");
    			button4.textContent = "Anmelden";
    			t41 = space();
    			footer = element("footer");
    			p5 = element("p");
    			p5.textContent = "© 2025 Tier-Quiz. Alle Rechte vorbehalten. Erlebe die Natur – Tag für Tag.";
    			attr_dev(div0, "class", "background-layer svelte-1bx74jv");
    			add_location(div0, file$3, 95, 0, 3196);
    			attr_dev(h1, "class", "svelte-1bx74jv");
    			add_location(h1, file$3, 104, 4, 3465);
    			attr_dev(p0, "class", "svelte-1bx74jv");
    			add_location(p0, file$3, 105, 4, 3536);
    			attr_dev(button0, "class", "cta-button svelte-1bx74jv");
    			add_location(button0, file$3, 109, 23, 3799);
    			attr_dev(a0, "href", "#/quiz");
    			attr_dev(a0, "class", "svelte-1bx74jv");
    			add_location(a0, file$3, 109, 6, 3782);
    			attr_dev(button1, "class", "cta-button svelte-1bx74jv");
    			add_location(button1, file$3, 110, 27, 3879);
    			attr_dev(a1, "href", "#/database");
    			attr_dev(a1, "class", "svelte-1bx74jv");
    			add_location(a1, file$3, 110, 6, 3858);
    			attr_dev(div1, "class", "hero-buttons svelte-1bx74jv");
    			add_location(div1, file$3, 108, 4, 3709);
    			attr_dev(div2, "class", "hero-content svelte-1bx74jv");
    			add_location(div2, file$3, 103, 2, 3434);
    			attr_dev(section0, "class", "hero-section svelte-1bx74jv");
    			add_location(section0, file$3, 102, 0, 3401);
    			attr_dev(h20, "class", "svelte-1bx74jv");
    			add_location(h20, file$3, 117, 2, 4042);
    			attr_dev(button2, "class", "carousel-nav svelte-1bx74jv");
    			add_location(button2, file$3, 119, 4, 4105);

    			if (!src_url_equal(img.src, img_src_value = /*featuredAnimal*/ ctx[2]
    			? /*featuredAnimal*/ ctx[2].imageUrl
    			: "https://via.placeholder.com/800x400?text=Loading...")) attr_dev(img, "src", img_src_value);

    			attr_dev(img, "alt", img_alt_value = /*featuredAnimal*/ ctx[2]
    			? /*featuredAnimal*/ ctx[2].name
    			: "Loading...");

    			attr_dev(img, "class", "svelte-1bx74jv");
    			add_location(img, file$3, 121, 6, 4236);
    			attr_dev(h30, "class", "svelte-1bx74jv");
    			add_location(h30, file$3, 126, 8, 4469);
    			attr_dev(div3, "class", "carousel-info svelte-1bx74jv");
    			add_location(div3, file$3, 125, 6, 4433);
    			attr_dev(div4, "class", "carousel-item svelte-1bx74jv");
    			add_location(div4, file$3, 120, 4, 4173);
    			attr_dev(button3, "class", "carousel-nav svelte-1bx74jv");
    			add_location(button3, file$3, 129, 4, 4550);
    			attr_dev(div5, "class", "carousel-container svelte-1bx74jv");
    			add_location(div5, file$3, 118, 2, 4068);
    			attr_dev(section1, "class", "featured-carousel svelte-1bx74jv");
    			add_location(section1, file$3, 116, 0, 4004);
    			attr_dev(h21, "class", "svelte-1bx74jv");
    			add_location(h21, file$3, 135, 2, 4699);
    			attr_dev(div6, "class", "gallery-grid svelte-1bx74jv");
    			add_location(div6, file$3, 136, 2, 4729);
    			attr_dev(section2, "class", "gallery-section svelte-1bx74jv");
    			add_location(section2, file$3, 134, 0, 4663);
    			attr_dev(h22, "class", "svelte-1bx74jv");
    			add_location(h22, file$3, 150, 2, 5201);
    			attr_dev(h31, "class", "svelte-1bx74jv");
    			add_location(h31, file$3, 153, 6, 5323);
    			attr_dev(p1, "class", "svelte-1bx74jv");
    			add_location(p1, file$3, 154, 6, 5349);
    			attr_dev(div7, "class", "fact-card svelte-1bx74jv");
    			add_location(div7, file$3, 152, 4, 5265);
    			attr_dev(h32, "class", "svelte-1bx74jv");
    			add_location(h32, file$3, 157, 6, 5513);
    			attr_dev(p2, "class", "svelte-1bx74jv");
    			add_location(p2, file$3, 158, 6, 5537);
    			attr_dev(div8, "class", "fact-card svelte-1bx74jv");
    			add_location(div8, file$3, 156, 4, 5443);
    			attr_dev(h33, "class", "svelte-1bx74jv");
    			add_location(h33, file$3, 161, 6, 5693);
    			attr_dev(p3, "class", "svelte-1bx74jv");
    			add_location(p3, file$3, 162, 6, 5718);
    			attr_dev(div9, "class", "fact-card svelte-1bx74jv");
    			add_location(div9, file$3, 160, 4, 5623);
    			attr_dev(div10, "class", "facts-container svelte-1bx74jv");
    			add_location(div10, file$3, 151, 2, 5231);
    			attr_dev(section3, "class", "interactive-section svelte-1bx74jv");
    			add_location(section3, file$3, 149, 0, 5161);
    			attr_dev(h23, "class", "svelte-1bx74jv");
    			add_location(h23, file$3, 169, 2, 5916);
    			attr_dev(p4, "class", "svelte-1bx74jv");
    			add_location(p4, file$3, 170, 2, 5952);
    			attr_dev(input, "type", "email");
    			attr_dev(input, "placeholder", "Deine E-Mail-Adresse");
    			input.required = true;
    			attr_dev(input, "class", "svelte-1bx74jv");
    			add_location(input, file$3, 174, 4, 6168);
    			attr_dev(button4, "type", "submit");
    			attr_dev(button4, "class", "signup-button svelte-1bx74jv");
    			add_location(button4, file$3, 175, 4, 6239);
    			attr_dev(form, "class", "signup-form svelte-1bx74jv");
    			add_location(form, file$3, 173, 2, 6068);
    			attr_dev(section4, "class", "cta-section svelte-1bx74jv");
    			add_location(section4, file$3, 168, 0, 5884);
    			attr_dev(p5, "class", "svelte-1bx74jv");
    			add_location(p5, file$3, 181, 2, 6370);
    			attr_dev(footer, "class", "main-footer svelte-1bx74jv");
    			add_location(footer, file$3, 180, 0, 6339);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div0, null);
    				}
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, section0, anchor);
    			append_dev(section0, div2);
    			append_dev(div2, h1);
    			append_dev(div2, t2);
    			append_dev(div2, p0);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, a0);
    			append_dev(a0, button0);
    			append_dev(div1, t6);
    			append_dev(div1, a1);
    			append_dev(a1, button1);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, h20);
    			append_dev(section1, t10);
    			append_dev(section1, div5);
    			append_dev(div5, button2);
    			append_dev(div5, t12);
    			append_dev(div5, div4);
    			append_dev(div4, img);
    			append_dev(div4, t13);
    			append_dev(div4, div3);
    			append_dev(div3, h30);
    			append_dev(h30, t14);
    			append_dev(div5, t15);
    			append_dev(div5, button3);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, section2, anchor);
    			append_dev(section2, h21);
    			append_dev(section2, t19);
    			append_dev(section2, div6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div6, null);
    				}
    			}

    			insert_dev(target, t20, anchor);
    			insert_dev(target, section3, anchor);
    			append_dev(section3, h22);
    			append_dev(section3, t22);
    			append_dev(section3, div10);
    			append_dev(div10, div7);
    			append_dev(div7, h31);
    			append_dev(div7, t24);
    			append_dev(div7, p1);
    			append_dev(div10, t26);
    			append_dev(div10, div8);
    			append_dev(div8, h32);
    			append_dev(div8, t28);
    			append_dev(div8, p2);
    			append_dev(div10, t30);
    			append_dev(div10, div9);
    			append_dev(div9, h33);
    			append_dev(div9, t32);
    			append_dev(div9, p3);
    			insert_dev(target, t34, anchor);
    			insert_dev(target, section4, anchor);
    			append_dev(section4, h23);
    			append_dev(section4, t36);
    			append_dev(section4, p4);
    			append_dev(section4, t38);
    			append_dev(section4, form);
    			append_dev(form, input);
    			append_dev(form, t39);
    			append_dev(form, button4);
    			insert_dev(target, t41, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, p5);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button2, "click", /*prevFeatured*/ ctx[4], false, false, false, false),
    					listen_dev(button3, "click", /*nextFeatured*/ ctx[3], false, false, false, false),
    					listen_dev(form, "submit", prevent_default(/*submit_handler*/ ctx[5]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*backgroundAnimals*/ 2) {
    				each_value_1 = /*backgroundAnimals*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*featuredAnimal*/ 4 && !src_url_equal(img.src, img_src_value = /*featuredAnimal*/ ctx[2]
    			? /*featuredAnimal*/ ctx[2].imageUrl
    			: "https://via.placeholder.com/800x400?text=Loading...")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*featuredAnimal*/ 4 && img_alt_value !== (img_alt_value = /*featuredAnimal*/ ctx[2]
    			? /*featuredAnimal*/ ctx[2].name
    			: "Loading...")) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*featuredAnimal*/ 4 && t14_value !== (t14_value = (/*featuredAnimal*/ ctx[2]
    			? /*featuredAnimal*/ ctx[2].name
    			: "") + "")) set_data_dev(t14, t14_value);

    			if (dirty & /*galleryAnimals*/ 1) {
    				each_value = /*galleryAnimals*/ ctx[0].slice(0, 6);
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each1_lookup, div6, destroy_block, create_each_block$3, null, get_each_context$3);
    			}
    		},
    		i: function intro(local) {
    			if (!h1_intro) {
    				add_render_callback(() => {
    					h1_intro = create_in_transition(h1, fade, { duration: 800 });
    					h1_intro.start();
    				});
    			}

    			if (!p0_intro) {
    				add_render_callback(() => {
    					p0_intro = create_in_transition(p0, fade, { delay: 300, duration: 700 });
    					p0_intro.start();
    				});
    			}

    			if (!div1_intro) {
    				add_render_callback(() => {
    					div1_intro = create_in_transition(div1, fade, { delay: 600, duration: 700 });
    					div1_intro.start();
    				});
    			}

    			if (!div4_intro) {
    				add_render_callback(() => {
    					div4_intro = create_in_transition(div4, slide, { duration: 600 });
    					div4_intro.start();
    				});
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			if (!div7_intro) {
    				add_render_callback(() => {
    					div7_intro = create_in_transition(div7, fade, { duration: 800 });
    					div7_intro.start();
    				});
    			}

    			if (!div8_intro) {
    				add_render_callback(() => {
    					div8_intro = create_in_transition(div8, fade, { duration: 800, delay: 200 });
    					div8_intro.start();
    				});
    			}

    			if (!div9_intro) {
    				add_render_callback(() => {
    					div9_intro = create_in_transition(div9, fade, { duration: 800, delay: 400 });
    					div9_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(section0);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(section1);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(section2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(section3);
    			if (detaching) detach_dev(t34);
    			if (detaching) detach_dev(section4);
    			if (detaching) detach_dev(t41);
    			if (detaching) detach_dev(footer);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const BACKGROUND_ANIMAL_COUNT = 12;

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	let galleryAnimals = [];

    	// 1) Initialisiert Galerie-Bilder für alle Tiere und aktualisiert galleryAnimals
    	async function initGalleryImages() {
    		await Promise.all(animals.map(async a => {
    			if (!a.imageUrl || a.imageUrl.trim() === "") {
    				const fetchedImage = await fetchUnsplashImage(a.name);
    				console.log(`Fetched image for ${a.name}: ${fetchedImage}`);
    				a.imageUrl = fetchedImage;
    			}
    		}));

    		// Erstelle eine Kopie, damit Svelte reaktiv reagiert:
    		$$invalidate(0, galleryAnimals = [...animals]);
    	}

    	let backgroundAnimals = [];

    	async function createRandomBackgroundAnimal() {
    		// Wähle ein zufälliges Tier aus dem (nun aktualisierten) animals-Array
    		const randomAnimal = animals[Math.floor(Math.random() * animals.length)];

    		return {
    			name: randomAnimal.name,
    			imageUrl: randomAnimal.imageUrl, // sollte nun gesetzt sein
    			x: Math.random() * 100,
    			y: Math.random() * 100,
    			speedX: (Math.random() - 0.5) * 0.02,
    			speedY: (Math.random() - 0.5) * 0.02
    		};
    	}

    	async function initBackgroundAnimals() {
    		$$invalidate(1, backgroundAnimals = await Promise.all(Array.from({ length: BACKGROUND_ANIMAL_COUNT }).map(() => createRandomBackgroundAnimal())));
    	}

    	function animateBackgroundAnimals() {
    		for (const b of backgroundAnimals) {
    			b.x += b.speedX;
    			b.y += b.speedY;

    			// Wrap-around: Wenn außerhalb des Bereichs, wieder von der anderen Seite erscheinen
    			if (b.x < -5) b.x = 105;

    			if (b.x > 105) b.x = -5;
    			if (b.y < -5) b.y = 105;
    			if (b.y > 105) b.y = -5;
    		}
    	}

    	// 3) Featured Animal Carousel
    	let featuredIndex = 0;

    	let featuredAnimal = null; // zunächst null

    	function nextFeatured() {
    		featuredIndex = (featuredIndex + 1) % animals.length;
    		$$invalidate(2, featuredAnimal = animals[featuredIndex]);
    	}

    	function prevFeatured() {
    		featuredIndex = (featuredIndex - 1 + animals.length) % animals.length;
    		$$invalidate(2, featuredAnimal = animals[featuredIndex]);
    	}

    	// 4) onMount: Initialisierung & Animationen
    	let carouselInterval, animInterval;

    	onMount(async () => {
    		// Zuerst: Alle Galerie-Bilder laden
    		await initGalleryImages();

    		// Setze featuredAnimal jetzt, nachdem alle Tiere (und ihre Bilder) geladen sind.
    		$$invalidate(2, featuredAnimal = animals[featuredIndex]);

    		// Danach: Initialisiere die Floating Animals
    		await initBackgroundAnimals();

    		// Starte das Featured Carousel (alle 5 Sekunden wechseln)
    		carouselInterval = setInterval(nextFeatured, 5000);

    		// Aktualisiere die Floating Animals alle 60ms
    		animInterval = setInterval(animateBackgroundAnimals, 60);

    		return () => {
    			clearInterval(carouselInterval);
    			clearInterval(animInterval);
    		};
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	const submit_handler = () => alert("Danke für deine Anmeldung!");

    	$$self.$capture_state = () => ({
    		onMount,
    		fade,
    		slide,
    		fly,
    		animals,
    		fetchUnsplashImage,
    		galleryAnimals,
    		initGalleryImages,
    		BACKGROUND_ANIMAL_COUNT,
    		backgroundAnimals,
    		createRandomBackgroundAnimal,
    		initBackgroundAnimals,
    		animateBackgroundAnimals,
    		featuredIndex,
    		featuredAnimal,
    		nextFeatured,
    		prevFeatured,
    		carouselInterval,
    		animInterval
    	});

    	$$self.$inject_state = $$props => {
    		if ('galleryAnimals' in $$props) $$invalidate(0, galleryAnimals = $$props.galleryAnimals);
    		if ('backgroundAnimals' in $$props) $$invalidate(1, backgroundAnimals = $$props.backgroundAnimals);
    		if ('featuredIndex' in $$props) featuredIndex = $$props.featuredIndex;
    		if ('featuredAnimal' in $$props) $$invalidate(2, featuredAnimal = $$props.featuredAnimal);
    		if ('carouselInterval' in $$props) carouselInterval = $$props.carouselInterval;
    		if ('animInterval' in $$props) animInterval = $$props.animInterval;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		galleryAnimals,
    		backgroundAnimals,
    		featuredAnimal,
    		nextFeatured,
    		prevFeatured,
    		submit_handler
    	];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/pages/Quiz.svelte generated by Svelte v3.59.2 */

    const { console: console_1$1 } = globals;

    const file$2 = "src/pages/Quiz.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i];
    	return child_ctx;
    }

    // (351:2) {:else}
    function create_else_block_1(ctx) {
    	let h2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Keine Frage geladen.";
    			add_location(h2, file$2, 351, 4, 9958);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(351:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (308:28) 
    function create_if_block_7(ctx) {
    	let h2;
    	let t0;
    	let t1;
    	let t2;
    	let p;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let div0;
    	let button0;
    	let t10;
    	let t11;
    	let button1;
    	let t12;
    	let t13;
    	let button2;
    	let t14;
    	let t15;
    	let t16;
    	let div1;
    	let button3;
    	let button3_transition;
    	let div1_transition;
    	let t17;
    	let div2;
    	let div2_transition;
    	let t18;
    	let if_block2_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*hintMessage*/ ctx[12] && create_if_block_10(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*isPlaying*/ ctx[8]) return create_if_block_9;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block1 = current_block_type(ctx);
    	let each_value = /*currentQuestion*/ ctx[7].speciesImages;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	let if_block2 = /*showFunFact*/ ctx[13] && /*currentFunFact*/ ctx[14] && create_if_block_8(ctx);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text("Runde ");
    			t1 = text(/*round*/ ctx[3]);
    			t2 = space();
    			p = element("p");
    			t3 = text("Score: ");
    			t4 = text(/*score*/ ctx[4]);
    			t5 = text(" | Highscore: ");
    			t6 = text(/*localHighscore*/ ctx[2]);
    			t7 = text(" | Streak: ");
    			t8 = text(/*streak*/ ctx[16]);
    			t9 = space();
    			div0 = element("div");
    			button0 = element("button");
    			t10 = text("🔪 50:50");
    			t11 = space();
    			button1 = element("button");
    			t12 = text("⏭ Skip");
    			t13 = space();
    			button2 = element("button");
    			t14 = text("💡 Hint");
    			t15 = space();
    			if (if_block0) if_block0.c();
    			t16 = space();
    			div1 = element("div");
    			button3 = element("button");
    			if_block1.c();
    			t17 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t18 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    			add_location(h2, file$2, 309, 4, 8588);
    			add_location(p, file$2, 310, 4, 8615);
    			button0.disabled = /*usedFiftyFifty*/ ctx[9];
    			attr_dev(button0, "class", "svelte-sa2c7m");
    			add_location(button0, file$2, 314, 6, 8752);
    			button1.disabled = /*usedSkip*/ ctx[10];
    			attr_dev(button1, "class", "svelte-sa2c7m");
    			add_location(button1, file$2, 315, 6, 8835);
    			button2.disabled = /*usedHint*/ ctx[11];
    			attr_dev(button2, "class", "svelte-sa2c7m");
    			add_location(button2, file$2, 316, 6, 8904);
    			attr_dev(div0, "class", "joker-buttons svelte-sa2c7m");
    			add_location(div0, file$2, 313, 4, 8718);
    			attr_dev(button3, "class", "play-button svelte-sa2c7m");
    			add_location(button3, file$2, 327, 6, 9188);
    			attr_dev(div1, "class", "audio-container svelte-sa2c7m");
    			add_location(div1, file$2, 326, 4, 9136);
    			attr_dev(div2, "class", "options-grid svelte-sa2c7m");
    			add_location(div2, file$2, 333, 4, 9356);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(p, t5);
    			append_dev(p, t6);
    			append_dev(p, t7);
    			append_dev(p, t8);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button0);
    			append_dev(button0, t10);
    			append_dev(div0, t11);
    			append_dev(div0, button1);
    			append_dev(button1, t12);
    			append_dev(div0, t13);
    			append_dev(div0, button2);
    			append_dev(button2, t14);
    			insert_dev(target, t15, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button3);
    			if_block1.m(button3, null);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, div2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div2, null);
    				}
    			}

    			insert_dev(target, t18, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*useFiftyFifty*/ ctx[24], false, false, false, false),
    					listen_dev(button1, "click", /*useSkip*/ ctx[25], false, false, false, false),
    					listen_dev(button2, "click", /*useHint*/ ctx[26], false, false, false, false),
    					listen_dev(button3, "click", /*togglePlay*/ ctx[21], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*round*/ 8) set_data_dev(t1, /*round*/ ctx[3]);
    			if (!current || dirty[0] & /*score*/ 16) set_data_dev(t4, /*score*/ ctx[4]);
    			if (!current || dirty[0] & /*localHighscore*/ 4) set_data_dev(t6, /*localHighscore*/ ctx[2]);
    			if (!current || dirty[0] & /*streak*/ 65536) set_data_dev(t8, /*streak*/ ctx[16]);

    			if (!current || dirty[0] & /*usedFiftyFifty*/ 512) {
    				prop_dev(button0, "disabled", /*usedFiftyFifty*/ ctx[9]);
    			}

    			if (!current || dirty[0] & /*usedSkip*/ 1024) {
    				prop_dev(button1, "disabled", /*usedSkip*/ ctx[10]);
    			}

    			if (!current || dirty[0] & /*usedHint*/ 2048) {
    				prop_dev(button2, "disabled", /*usedHint*/ ctx[11]);
    			}

    			if (/*hintMessage*/ ctx[12]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*hintMessage*/ 4096) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_10(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t16.parentNode, t16);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(button3, null);
    				}
    			}

    			if (dirty[0] & /*handleAnswer, currentQuestion*/ 4194432) {
    				each_value = /*currentQuestion*/ ctx[7].speciesImages;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*showFunFact*/ ctx[13] && /*currentFunFact*/ ctx[14]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*showFunFact, currentFunFact*/ 24576) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_8(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);

    			add_render_callback(() => {
    				if (!current) return;
    				if (!button3_transition) button3_transition = create_bidirectional_transition(button3, scale, {}, true);
    				button3_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!current) return;
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!current) return;
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, true);
    				div2_transition.run(1);
    			});

    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			if (!button3_transition) button3_transition = create_bidirectional_transition(button3, scale, {}, false);
    			button3_transition.run(0);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, false);
    			div2_transition.run(0);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t15);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(div1);
    			if_block1.d();
    			if (detaching && button3_transition) button3_transition.end();
    			if (detaching && div1_transition) div1_transition.end();
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div2_transition) div2_transition.end();
    			if (detaching) detach_dev(t18);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(308:28) ",
    		ctx
    	});

    	return block;
    }

    // (305:20) 
    function create_if_block_6(ctx) {
    	let h2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Lädt Daten ...";
    			add_location(h2, file$2, 306, 4, 8508);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(305:20) ",
    		ctx
    	});

    	return block;
    }

    // (297:21) 
    function create_if_block_5(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let p0;
    	let t2;
    	let t3;
    	let t4;
    	let p1;
    	let t5;
    	let t6;
    	let t7;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Falsche Antwort!";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("Dein Score: ");
    			t3 = text(/*score*/ ctx[4]);
    			t4 = space();
    			p1 = element("p");
    			t5 = text("Dein Highscore: ");
    			t6 = text(/*localHighscore*/ ctx[2]);
    			t7 = space();
    			button = element("button");
    			button.textContent = "Nochmal spielen";
    			add_location(h2, file$2, 299, 6, 8280);
    			add_location(p0, file$2, 300, 6, 8312);
    			add_location(p1, file$2, 301, 6, 8345);
    			attr_dev(button, "class", "svelte-sa2c7m");
    			add_location(button, file$2, 302, 6, 8391);
    			attr_dev(div, "class", "game-over-screen svelte-sa2c7m");
    			add_location(div, file$2, 298, 4, 8243);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(div, t4);
    			append_dev(div, p1);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    			append_dev(div, t7);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*restartGame*/ ctx[23], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*score*/ 16) set_data_dev(t3, /*score*/ ctx[4]);
    			if (dirty[0] & /*localHighscore*/ 4) set_data_dev(t6, /*localHighscore*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(297:21) ",
    		ctx
    	});

    	return block;
    }

    // (285:2) {#if showNameInput}
    function create_if_block_4(ctx) {
    	let h2;
    	let t1;
    	let div;
    	let input;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Wie heißt du?";
    			t1 = space();
    			div = element("div");
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Start";
    			add_location(h2, file$2, 286, 4, 7907);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Dein Name");
    			attr_dev(input, "class", "svelte-sa2c7m");
    			add_location(input, file$2, 288, 6, 7965);
    			attr_dev(button, "class", "svelte-sa2c7m");
    			add_location(button, file$2, 294, 6, 8132);
    			attr_dev(div, "class", "name-input svelte-sa2c7m");
    			add_location(div, file$2, 287, 4, 7934);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*playerName*/ ctx[0]);
    			append_dev(div, t2);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[27]),
    					listen_dev(input, "keydown", /*keydown_handler*/ ctx[28], false, false, false, false),
    					listen_dev(button, "click", /*startGame*/ ctx[20], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*playerName*/ 1 && input.value !== /*playerName*/ ctx[0]) {
    				set_input_value(input, /*playerName*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(285:2) {#if showNameInput}",
    		ctx
    	});

    	return block;
    }

    // (320:4) {#if hintMessage}
    function create_if_block_10(ctx) {
    	let div;
    	let t;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*hintMessage*/ ctx[12]);
    			attr_dev(div, "class", "hint-message svelte-sa2c7m");
    			add_location(div, file$2, 320, 6, 9008);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*hintMessage*/ 4096) set_data_dev(t, /*hintMessage*/ ctx[12]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: 20 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: 20 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(320:4) {#if hintMessage}",
    		ctx
    	});

    	return block;
    }

    // (329:26) {:else}
    function create_else_block$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("▶");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(329:26) {:else}",
    		ctx
    	});

    	return block;
    }

    // (329:8) {#if isPlaying}
    function create_if_block_9(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("⏸");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(329:8) {#if isPlaying}",
    		ctx
    	});

    	return block;
    }

    // (335:6) {#each currentQuestion.speciesImages as opt}
    function create_each_block$2(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div1;
    	let div0;
    	let t1_value = /*opt*/ ctx[37].name + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[29](/*opt*/ ctx[37]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(img, "class", "option-image svelte-sa2c7m");
    			if (!src_url_equal(img.src, img_src_value = /*opt*/ ctx[37].imageUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*opt*/ ctx[37].name);
    			add_location(img, file$2, 336, 10, 9537);
    			attr_dev(div0, "class", "option-title svelte-sa2c7m");
    			add_location(div0, file$2, 338, 12, 9651);
    			attr_dev(div1, "class", "option-overlay svelte-sa2c7m");
    			add_location(div1, file$2, 337, 10, 9610);
    			attr_dev(button, "class", "option-card svelte-sa2c7m");
    			add_location(button, file$2, 335, 8, 9458);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			append_dev(button, t0);
    			append_dev(button, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*currentQuestion*/ 128 && !src_url_equal(img.src, img_src_value = /*opt*/ ctx[37].imageUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*currentQuestion*/ 128 && img_alt_value !== (img_alt_value = /*opt*/ ctx[37].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty[0] & /*currentQuestion*/ 128 && t1_value !== (t1_value = /*opt*/ ctx[37].name + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(335:6) {#each currentQuestion.speciesImages as opt}",
    		ctx
    	});

    	return block;
    }

    // (346:4) {#if showFunFact && currentFunFact}
    function create_if_block_8(ctx) {
    	let div;
    	let strong;
    	let t1;
    	let t2;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			strong = element("strong");
    			strong.textContent = "Fun Fact:";
    			t1 = space();
    			t2 = text(/*currentFunFact*/ ctx[14]);
    			add_location(strong, file$2, 347, 8, 9877);
    			attr_dev(div, "class", "fun-fact-popup svelte-sa2c7m");
    			add_location(div, file$2, 346, 6, 9823);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, strong);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*currentFunFact*/ 16384) set_data_dev(t2, /*currentFunFact*/ ctx[14]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (!div_transition) div_transition = create_bidirectional_transition(div, scale, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, scale, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(346:4) {#if showFunFact && currentFunFact}",
    		ctx
    	});

    	return block;
    }

    // (357:0) {#if showPowerUpAnimation}
    function create_if_block_3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "🔥 Power-Ups erneuert!";
    			attr_dev(div, "class", "powerup-animation svelte-sa2c7m");
    			add_location(div, file$2, 357, 2, 10097);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(357:0) {#if showPowerUpAnimation}",
    		ctx
    	});

    	return block;
    }

    // (362:0) {#if showStreakBonus}
    function create_if_block_2$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "+1 Streak-Bonus!";
    			attr_dev(div, "class", "streak-bonus svelte-sa2c7m");
    			add_location(div, file$2, 362, 2, 10195);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(362:0) {#if showStreakBonus}",
    		ctx
    	});

    	return block;
    }

    // (367:0) {#if showCorrectAnimation}
    function create_if_block_1$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "✔";
    			attr_dev(div, "class", "correct-animation svelte-sa2c7m");
    			add_location(div, file$2, 367, 2, 10287);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(367:0) {#if showCorrectAnimation}",
    		ctx
    	});

    	return block;
    }

    // (370:0) {#if showWrongAnimation}
    function create_if_block$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "✖";
    			attr_dev(div, "class", "wrong-animation svelte-sa2c7m");
    			add_location(div, file$2, 370, 2, 10359);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(370:0) {#if showWrongAnimation}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block0;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let if_block4_anchor;
    	let current;

    	const if_block_creators = [
    		create_if_block_4,
    		create_if_block_5,
    		create_if_block_6,
    		create_if_block_7,
    		create_else_block_1
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*showNameInput*/ ctx[1]) return 0;
    		if (/*gameOver*/ ctx[5]) return 1;
    		if (/*loading*/ ctx[6]) return 2;
    		if (/*currentQuestion*/ ctx[7]) return 3;
    		return 4;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*showPowerUpAnimation*/ ctx[15] && create_if_block_3(ctx);
    	let if_block2 = /*showStreakBonus*/ ctx[17] && create_if_block_2$1(ctx);
    	let if_block3 = /*showCorrectAnimation*/ ctx[18] && create_if_block_1$1(ctx);
    	let if_block4 = /*showWrongAnimation*/ ctx[19] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			if (if_block4) if_block4.c();
    			if_block4_anchor = empty();
    			attr_dev(div, "class", "container svelte-sa2c7m");
    			add_location(div, file$2, 283, 0, 7830);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert_dev(target, if_block4_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div, null);
    			}

    			if (/*showPowerUpAnimation*/ ctx[15]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*showStreakBonus*/ ctx[17]) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_2$1(ctx);
    					if_block2.c();
    					if_block2.m(t2.parentNode, t2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*showCorrectAnimation*/ ctx[18]) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block_1$1(ctx);
    					if_block3.c();
    					if_block3.m(t3.parentNode, t3);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (/*showWrongAnimation*/ ctx[19]) {
    				if (if_block4) ; else {
    					if_block4 = create_if_block$2(ctx);
    					if_block4.c();
    					if_block4.m(if_block4_anchor.parentNode, if_block4_anchor);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach_dev(if_block4_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Quiz', slots, []);
    	let playerName = "";
    	let showNameInput = true;
    	let localHighscore = 0;
    	let round = 1;
    	let score = 0;
    	let gameOver = false;
    	let loading = false;
    	let currentQuestion = null;
    	let isPlaying = false;
    	let audioElement = null;

    	// Joker
    	let usedFiftyFifty = false;

    	let usedSkip = false;
    	let usedHint = false;
    	let hintMessage = "";

    	// Fun Fact
    	let showFunFact = false;

    	let currentFunFact = "";

    	// Power-Up & Streak
    	let showPowerUpAnimation = false;

    	let streak = 0;
    	let showStreakBonus = false;
    	let showCorrectAnimation = false;
    	let showWrongAnimation = false;

    	// Fallback-Fun Facts
    	const funFactsMap = {
    		katze: "Katzen können bis zu 100 verschiedene Lautvariationen erzeugen.",
    		hund: "Hunde haben etwa 40-mal mehr Geruchsrezeptoren als Menschen!",
    		kuh: "Kühe haben beste Freundinnen und fühlen sich ruhiger, wenn sie zusammenstehen.",
    		elefant: "Elefanten zeigen Trauer, Mitgefühl und Altruismus.",
    		löwe: "Löwen schlafen bis zu 20 Stunden am Tag!"
    	};

    	// ---------------------------------------------
    	// Spielstart, Highscore & onMount
    	// ---------------------------------------------
    	function startGame() {
    		if (!playerName.trim()) return;
    		$$invalidate(1, showNameInput = false);

    		// Lade Highscore aus LocalStorage
    		$$invalidate(2, localHighscore = parseInt(localStorage.getItem(`highscore_${playerName}`) || "0"));

    		$$invalidate(3, round = 1);
    		$$invalidate(4, score = 0);
    		$$invalidate(16, streak = 0);
    		$$invalidate(5, gameOver = false);
    		$$invalidate(9, usedFiftyFifty = false);
    		$$invalidate(10, usedSkip = false);
    		$$invalidate(11, usedHint = false);
    		$$invalidate(12, hintMessage = "");
    		$$invalidate(13, showFunFact = false);
    		$$invalidate(14, currentFunFact = "");
    		loadNewQuestion();
    	}

    	function updateHighscore() {
    		if (score > localHighscore) {
    			$$invalidate(2, localHighscore = score);
    			localStorage.setItem(`highscore_${playerName}`, localHighscore.toString());
    		}
    	}

    	onMount(() => {
    		// Audio-Element initialisieren
    		audioElement = document.createElement("audio");

    		audioElement.crossOrigin = "anonymous";
    	});

    	// ---------------------------------------------
    	// Neue Frage laden
    	// ---------------------------------------------
    	let usedAnimals = []; // Liste für abgefragte Tiere

    	async function loadNewQuestion() {
    		try {
    			$$invalidate(6, loading = true);
    			$$invalidate(13, showFunFact = false);
    			$$invalidate(12, hintMessage = "");
    			stopAudio();
    			const availableAnimals = animals.filter(a => !usedAnimals.includes(a.name));

    			if (availableAnimals.length === 0) {
    				alert("Alle Tiere wurden abgefragt!");
    				return;
    			}

    			const correctAnimal = availableAnimals[Math.floor(Math.random() * availableAnimals.length)];
    			usedAnimals.push(correctAnimal.name); // Das Tier zur Liste hinzufügen
    			const correctName = correctAnimal.name.toLowerCase();

    			// Fun Fact aus Map oder Wikipedia
    			const possibleFunFact = funFactsMap[correctName] ? funFactsMap[correctName] : "";

    			let wrongOptions = animals.filter(a => a.name !== correctAnimal.name);
    			wrongOptions = shuffleArray(wrongOptions).slice(0, 3);
    			const options = shuffleArray([correctAnimal, ...wrongOptions]);
    			const loadedOptions = await fetchImageOptions(options);

    			$$invalidate(7, currentQuestion = {
    				correctSpecies: correctAnimal.name,
    				soundUrl: correctAnimal.soundUrl,
    				speciesImages: loadedOptions,
    				funFact: possibleFunFact
    			});
    		} catch(error) {
    			console.error(error);
    			$$invalidate(7, currentQuestion = null);
    		} finally {
    			$$invalidate(6, loading = false);
    			await tick();
    		}
    	}

    	async function fetchImageOptions(opts) {
    		const results = [];

    		for (const o of opts) {
    			let img = o.imageUrl;

    			if (!img) {
    				// Lade Unsplash-Bild
    				img = await fetchUnsplashImage(o.name);

    				const found = animals.find(a => a.name === o.name);
    				if (found) found.imageUrl = img;
    			}

    			results.push({
    				name: o.name,
    				soundUrl: o.soundUrl,
    				imageUrl: img || ""
    			});
    		}

    		return results;
    	}

    	// ---------------------------------------------
    	// Audio-Funktionen
    	// ---------------------------------------------
    	async function togglePlay() {
    		if (!currentQuestion || !audioElement) return;

    		if (!isPlaying) {
    			try {
    				audioElement.src = currentQuestion.soundUrl;
    				audioElement.crossOrigin = "anonymous";
    				await audioElement.play();
    				$$invalidate(8, isPlaying = true);
    			} catch(e) {
    				console.error("Audio konnte nicht abgespielt werden", e);
    			}
    		} else {
    			audioElement.pause();
    			audioElement.currentTime = 0;
    			$$invalidate(8, isPlaying = false);
    		}
    	}

    	function stopAudio() {
    		if (audioElement) {
    			audioElement.pause();
    			audioElement.currentTime = 0;
    		}

    		$$invalidate(8, isPlaying = false);
    	}

    	// ---------------------------------------------
    	// Antworten im Quiz
    	// ---------------------------------------------
    	async function handleAnswer(name) {
    		if (!currentQuestion) return;

    		if (name === currentQuestion.correctSpecies) {
    			// Richtig
    			$$invalidate(18, showCorrectAnimation = true);

    			setTimeout(
    				() => {
    					$$invalidate(18, showCorrectAnimation = false);
    				},
    				800
    			);

    			$$invalidate(4, score++, score);
    			$$invalidate(16, streak++, streak);

    			if (streak % 3 === 0) {
    				$$invalidate(4, score += 1);
    				$$invalidate(17, showStreakBonus = true);

    				setTimeout(
    					() => {
    						$$invalidate(17, showStreakBonus = false);
    					},
    					1500
    				);
    			}

    			// Zeige Fun Fact (falls vorhanden)
    			if (currentQuestion.funFact) {
    				$$invalidate(14, currentFunFact = currentQuestion.funFact);
    				$$invalidate(13, showFunFact = true);
    			}

    			// Joker regenerieren alle 5 Runden
    			if (round % 5 === 0) {
    				$$invalidate(9, usedFiftyFifty = false);
    				$$invalidate(10, usedSkip = false);
    				$$invalidate(11, usedHint = false);
    				$$invalidate(15, showPowerUpAnimation = true);

    				setTimeout(
    					() => {
    						$$invalidate(15, showPowerUpAnimation = false);
    					},
    					2000
    				);
    			}

    			$$invalidate(3, round++, round);
    			setTimeout(loadNewQuestion, 1500);
    		} else {
    			// Falsch
    			$$invalidate(19, showWrongAnimation = true);

    			setTimeout(
    				() => {
    					$$invalidate(19, showWrongAnimation = false);
    					$$invalidate(5, gameOver = true);
    					stopAudio();
    					updateHighscore();
    					$$invalidate(16, streak = 0);
    				},
    				800
    			);
    		}
    	}

    	function restartGame() {
    		$$invalidate(3, round = 1);
    		$$invalidate(4, score = 0);
    		$$invalidate(16, streak = 0);
    		$$invalidate(5, gameOver = false);
    		$$invalidate(7, currentQuestion = null);
    		stopAudio();
    		$$invalidate(9, usedFiftyFifty = false);
    		$$invalidate(10, usedSkip = false);
    		$$invalidate(11, usedHint = false);
    		$$invalidate(12, hintMessage = "");
    		$$invalidate(13, showFunFact = false);
    		$$invalidate(14, currentFunFact = "");
    		loadNewQuestion();
    	}

    	// ---------------------------------------------
    	// Joker-Funktionen
    	// ---------------------------------------------
    	function useFiftyFifty() {
    		if (!currentQuestion || usedFiftyFifty) return;
    		$$invalidate(9, usedFiftyFifty = true);
    		const { correctSpecies, speciesImages } = currentQuestion;
    		const correctOption = speciesImages.find(o => o.name === correctSpecies);
    		const wrongs = speciesImages.filter(o => o.name !== correctSpecies);

    		if (wrongs.length && correctOption) {
    			const oneWrong = wrongs[Math.floor(Math.random() * wrongs.length)];
    			$$invalidate(7, currentQuestion.speciesImages = shuffleArray([correctOption, oneWrong]), currentQuestion);
    		}
    	}

    	function useSkip() {
    		if (usedSkip) return;
    		$$invalidate(10, usedSkip = true);
    		$$invalidate(3, round++, round);
    		stopAudio();
    		$$invalidate(16, streak = 0);
    		setTimeout(loadNewQuestion, 500);
    	}

    	function useHint() {
    		if (!currentQuestion || usedHint) return;
    		$$invalidate(11, usedHint = true);
    		const c = currentQuestion.correctSpecies;
    		$$invalidate(12, hintMessage = `Hinweis: ${c.length} Buchstaben, beginnt mit "${c[0]}" und endet mit "${c[c.length - 1]}".`);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Quiz> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		playerName = this.value;
    		$$invalidate(0, playerName);
    	}

    	const keydown_handler = e => e.key === "Enter" && startGame();
    	const click_handler = opt => handleAnswer(opt.name);

    	$$self.$capture_state = () => ({
    		onMount,
    		tick,
    		fade,
    		scale,
    		fly,
    		slide,
    		animals,
    		fetchUnsplashImage,
    		fetchAnimalFunFact,
    		shuffleArray,
    		getMimeType,
    		translateToEnglish,
    		playerName,
    		showNameInput,
    		localHighscore,
    		round,
    		score,
    		gameOver,
    		loading,
    		currentQuestion,
    		isPlaying,
    		audioElement,
    		usedFiftyFifty,
    		usedSkip,
    		usedHint,
    		hintMessage,
    		showFunFact,
    		currentFunFact,
    		showPowerUpAnimation,
    		streak,
    		showStreakBonus,
    		showCorrectAnimation,
    		showWrongAnimation,
    		funFactsMap,
    		startGame,
    		updateHighscore,
    		usedAnimals,
    		loadNewQuestion,
    		fetchImageOptions,
    		togglePlay,
    		stopAudio,
    		handleAnswer,
    		restartGame,
    		useFiftyFifty,
    		useSkip,
    		useHint
    	});

    	$$self.$inject_state = $$props => {
    		if ('playerName' in $$props) $$invalidate(0, playerName = $$props.playerName);
    		if ('showNameInput' in $$props) $$invalidate(1, showNameInput = $$props.showNameInput);
    		if ('localHighscore' in $$props) $$invalidate(2, localHighscore = $$props.localHighscore);
    		if ('round' in $$props) $$invalidate(3, round = $$props.round);
    		if ('score' in $$props) $$invalidate(4, score = $$props.score);
    		if ('gameOver' in $$props) $$invalidate(5, gameOver = $$props.gameOver);
    		if ('loading' in $$props) $$invalidate(6, loading = $$props.loading);
    		if ('currentQuestion' in $$props) $$invalidate(7, currentQuestion = $$props.currentQuestion);
    		if ('isPlaying' in $$props) $$invalidate(8, isPlaying = $$props.isPlaying);
    		if ('audioElement' in $$props) audioElement = $$props.audioElement;
    		if ('usedFiftyFifty' in $$props) $$invalidate(9, usedFiftyFifty = $$props.usedFiftyFifty);
    		if ('usedSkip' in $$props) $$invalidate(10, usedSkip = $$props.usedSkip);
    		if ('usedHint' in $$props) $$invalidate(11, usedHint = $$props.usedHint);
    		if ('hintMessage' in $$props) $$invalidate(12, hintMessage = $$props.hintMessage);
    		if ('showFunFact' in $$props) $$invalidate(13, showFunFact = $$props.showFunFact);
    		if ('currentFunFact' in $$props) $$invalidate(14, currentFunFact = $$props.currentFunFact);
    		if ('showPowerUpAnimation' in $$props) $$invalidate(15, showPowerUpAnimation = $$props.showPowerUpAnimation);
    		if ('streak' in $$props) $$invalidate(16, streak = $$props.streak);
    		if ('showStreakBonus' in $$props) $$invalidate(17, showStreakBonus = $$props.showStreakBonus);
    		if ('showCorrectAnimation' in $$props) $$invalidate(18, showCorrectAnimation = $$props.showCorrectAnimation);
    		if ('showWrongAnimation' in $$props) $$invalidate(19, showWrongAnimation = $$props.showWrongAnimation);
    		if ('usedAnimals' in $$props) usedAnimals = $$props.usedAnimals;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		playerName,
    		showNameInput,
    		localHighscore,
    		round,
    		score,
    		gameOver,
    		loading,
    		currentQuestion,
    		isPlaying,
    		usedFiftyFifty,
    		usedSkip,
    		usedHint,
    		hintMessage,
    		showFunFact,
    		currentFunFact,
    		showPowerUpAnimation,
    		streak,
    		showStreakBonus,
    		showCorrectAnimation,
    		showWrongAnimation,
    		startGame,
    		togglePlay,
    		handleAnswer,
    		restartGame,
    		useFiftyFifty,
    		useSkip,
    		useHint,
    		input_input_handler,
    		keydown_handler,
    		click_handler
    	];
    }

    class Quiz extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Quiz",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/pages/Database.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file$1 = "src/pages/Database.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	child_ctx[15] = i;
    	return child_ctx;
    }

    // (139:33) {:else}
    function create_else_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("▶");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(139:33) {:else}",
    		ctx
    	});

    	return block;
    }

    // (139:12) {#if an.isPlaying}
    function create_if_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("⏸");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(139:12) {#if an.isPlaying}",
    		ctx
    	});

    	return block;
    }

    // (144:8) {#if an.showFunFact && an.funFact}
    function create_if_block_1(ctx) {
    	let p;
    	let t_value = /*an*/ ctx[13].funFact + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "fun-fact svelte-1e7ydf2");
    			add_location(p, file$1, 144, 10, 4162);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*filteredAnimals, displayCount*/ 6 && t_value !== (t_value = /*an*/ ctx[13].funFact + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(144:8) {#if an.showFunFact && an.funFact}",
    		ctx
    	});

    	return block;
    }

    // (114:4) {#each filteredAnimals.slice(0, displayCount) as an, i (an.name)}
    function create_each_block$1(key_1, ctx) {
    	let div1;
    	let img;
    	let img_alt_value;
    	let img_src_value;
    	let t0;
    	let h4;
    	let t1_value = /*an*/ ctx[13].name + "";
    	let t1;
    	let t2;
    	let div0;
    	let audio;
    	let source;
    	let source_src_value;
    	let source_type_value;
    	let audio_id_value;
    	let t3;
    	let button;
    	let t4;
    	let t5;
    	let div1_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*an*/ ctx[13].isPlaying) return create_if_block_2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[9](/*i*/ ctx[15]);
    	}

    	let if_block1 = /*an*/ ctx[13].showFunFact && /*an*/ ctx[13].funFact && create_if_block_1(ctx);

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[10](/*an*/ ctx[13]);
    	}

    	function keydown_handler(...args) {
    		return /*keydown_handler*/ ctx[11](/*an*/ ctx[13], ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			h4 = element("h4");
    			t1 = text(t1_value);
    			t2 = space();
    			div0 = element("div");
    			audio = element("audio");
    			source = element("source");
    			t3 = space();
    			button = element("button");
    			if_block0.c();
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			attr_dev(img, "alt", img_alt_value = /*an*/ ctx[13].name);
    			if (!src_url_equal(img.src, img_src_value = /*an*/ ctx[13].imageUrl || "https://via.placeholder.com/300?text=loading...")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1e7ydf2");
    			add_location(img, file$1, 125, 8, 3465);
    			attr_dev(h4, "class", "svelte-1e7ydf2");
    			add_location(h4, file$1, 129, 8, 3594);
    			if (!src_url_equal(source.src, source_src_value = /*an*/ ctx[13].soundUrl)) attr_dev(source, "src", source_src_value);
    			attr_dev(source, "type", source_type_value = getMimeType(/*an*/ ctx[13].soundUrl));
    			add_location(source, file$1, 134, 12, 3751);
    			attr_dev(audio, "id", audio_id_value = "db-audio-" + /*i*/ ctx[15]);
    			attr_dev(audio, "crossorigin", "anonymous");
    			add_location(audio, file$1, 133, 10, 3686);
    			attr_dev(button, "class", "svelte-1e7ydf2");
    			add_location(button, file$1, 137, 10, 3940);
    			attr_dev(div0, "class", "db-audio svelte-1e7ydf2");
    			add_location(div0, file$1, 132, 8, 3653);
    			attr_dev(div1, "class", "db-card svelte-1e7ydf2");
    			attr_dev(div1, "role", "button");
    			attr_dev(div1, "tabindex", "0");
    			add_location(div1, file$1, 115, 6, 3200);
    			this.first = div1;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, h4);
    			append_dev(h4, t1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, audio);
    			append_dev(audio, source);
    			append_dev(div0, t3);
    			append_dev(div0, button);
    			if_block0.m(button, null);
    			append_dev(div1, t4);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t5);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", stop_propagation(click_handler), false, false, true, false),
    					listen_dev(div1, "click", click_handler_1, false, false, false, false),
    					listen_dev(div1, "keydown", keydown_handler, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*filteredAnimals, displayCount*/ 6 && img_alt_value !== (img_alt_value = /*an*/ ctx[13].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (!current || dirty & /*filteredAnimals, displayCount*/ 6 && !src_url_equal(img.src, img_src_value = /*an*/ ctx[13].imageUrl || "https://via.placeholder.com/300?text=loading...")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if ((!current || dirty & /*filteredAnimals, displayCount*/ 6) && t1_value !== (t1_value = /*an*/ ctx[13].name + "")) set_data_dev(t1, t1_value);

    			if (!current || dirty & /*filteredAnimals, displayCount*/ 6 && !src_url_equal(source.src, source_src_value = /*an*/ ctx[13].soundUrl)) {
    				attr_dev(source, "src", source_src_value);
    			}

    			if (!current || dirty & /*filteredAnimals, displayCount*/ 6 && source_type_value !== (source_type_value = getMimeType(/*an*/ ctx[13].soundUrl))) {
    				attr_dev(source, "type", source_type_value);
    			}

    			if (!current || dirty & /*filteredAnimals, displayCount*/ 6 && audio_id_value !== (audio_id_value = "db-audio-" + /*i*/ ctx[15])) {
    				attr_dev(audio, "id", audio_id_value);
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button, null);
    				}
    			}

    			if (/*an*/ ctx[13].showFunFact && /*an*/ ctx[13].funFact) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div1, t5);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, scale, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, scale, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			if (detaching && div1_transition) div1_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(114:4) {#each filteredAnimals.slice(0, displayCount) as an, i (an.name)}",
    		ctx
    	});

    	return block;
    }

    // (151:2) {#if displayCount < filteredAnimals.length}
    function create_if_block$1(ctx) {
    	let div;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Mehr laden";
    			attr_dev(button, "class", "load-more-button svelte-1e7ydf2");
    			add_location(button, file$1, 152, 6, 4338);
    			attr_dev(div, "class", "load-more-container svelte-1e7ydf2");
    			add_location(div, file$1, 151, 4, 4298);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*loadMore*/ ctx[7], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(151:2) {#if displayCount < filteredAnimals.length}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div2;
    	let h2;
    	let t1;
    	let div0;
    	let input;
    	let t2;
    	let button;
    	let t4;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let div1_transition;
    	let t5;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*filteredAnimals*/ ctx[1].slice(0, /*displayCount*/ ctx[2]);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*an*/ ctx[13].name;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	let if_block = /*displayCount*/ ctx[2] < /*filteredAnimals*/ ctx[1].length && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Tier-Datenbank";
    			t1 = space();
    			div0 = element("div");
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Bilder laden";
    			t4 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			if (if_block) if_block.c();
    			add_location(h2, file$1, 101, 2, 2746);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Suchbegriff eingeben...");
    			attr_dev(input, "class", "svelte-1e7ydf2");
    			add_location(input, file$1, 103, 4, 2800);
    			attr_dev(button, "class", "svelte-1e7ydf2");
    			add_location(button, file$1, 109, 4, 2942);
    			attr_dev(div0, "class", "db-search svelte-1e7ydf2");
    			add_location(div0, file$1, 102, 2, 2772);
    			attr_dev(div1, "class", "db-cards svelte-1e7ydf2");
    			add_location(div1, file$1, 112, 2, 3011);
    			attr_dev(div2, "class", "container svelte-1e7ydf2");
    			add_location(div2, file$1, 100, 0, 2720);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h2);
    			append_dev(div2, t1);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*searchQuery*/ ctx[0]);
    			append_dev(div0, t2);
    			append_dev(div0, button);
    			append_dev(div2, t4);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}

    			append_dev(div2, t5);
    			if (if_block) if_block.m(div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[8]),
    					listen_dev(input, "input", /*filterAnimals*/ ctx[3], false, false, false, false),
    					listen_dev(button, "click", /*refreshDatabase*/ ctx[4], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searchQuery*/ 1 && input.value !== /*searchQuery*/ ctx[0]) {
    				set_input_value(input, /*searchQuery*/ ctx[0]);
    			}

    			if (dirty & /*toggleFunFact, filteredAnimals, displayCount, handleDbPlay, getMimeType*/ 102) {
    				each_value = /*filteredAnimals*/ ctx[1].slice(0, /*displayCount*/ ctx[2]);
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div1, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				check_outros();
    			}

    			if (/*displayCount*/ ctx[2] < /*filteredAnimals*/ ctx[1].length) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div2, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (!current) return;
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, {}, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching && div1_transition) div1_transition.end();
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Database', slots, []);
    	let searchQuery = "";
    	let filteredAnimals = [...animals];
    	let displayCount = 3;

    	// Bilder beim Seitenaufruf laden
    	async function loadDatabaseImages() {
    		await Promise.all(animals.map(async a => {
    			if (!a.imageUrl) {
    				a.imageUrl = await fetchUnsplashImage(a.name);
    			}

    			a.isPlaying = false;

    			// Wir laden Fun Facts erst bei Klick (toggleFunFact),
    			// damit die Seite schneller lädt.
    			a.showFunFact = false;
    		})); // a.funFact wird erst bei Klick geladen.

    		filterAnimals();
    	}

    	function filterAnimals() {
    		if (!searchQuery.trim()) {
    			$$invalidate(1, filteredAnimals = [...animals]);
    			$$invalidate(2, displayCount = 3);
    			return;
    		}

    		const q = searchQuery.trim().toLowerCase();
    		$$invalidate(1, filteredAnimals = animals.filter(a => a.name.toLowerCase().includes(q)));
    		$$invalidate(2, displayCount = Math.min(3, filteredAnimals.length));
    	}

    	async function refreshDatabase() {
    		await loadDatabaseImages();
    	}

    	function handleDbPlay(index) {
    		const aud = document.getElementById("db-audio-" + index);
    		if (!aud || !filteredAnimals[index].soundUrl) return;

    		if (filteredAnimals[index].isPlaying) {
    			// bereits spielend -> stop
    			aud.pause();

    			aud.currentTime = 0;
    			$$invalidate(1, filteredAnimals[index].isPlaying = false, filteredAnimals);
    		} else {
    			// Stoppe alle anderen Audios
    			filteredAnimals.forEach((item, idx) => {
    				if (idx !== index && item.isPlaying) {
    					const otherAud = document.getElementById("db-audio-" + idx);

    					if (otherAud) {
    						otherAud.pause();
    						otherAud.currentTime = 0;
    					}

    					item.isPlaying = false;
    				}
    			});

    			aud.play().catch(e => console.error("Audio-Play error", e));
    			$$invalidate(1, filteredAnimals[index].isPlaying = true, filteredAnimals);
    		}

    		// Neu zuweisen, damit Svelte reaktiv reagiert
    		$$invalidate(1, filteredAnimals = [...filteredAnimals]);
    	}

    	// Beim Klick togglen wir den Fun Fact
    	async function toggleFunFact(an) {
    		if (an.showFunFact) {
    			an.showFunFact = false;
    		} else {
    			// Beim ersten Klick -> ggf. Wikipedia-Fun Fact laden
    			if (!an.funFact) {
    				an.funFact = await fetchAnimalFunFact(an.name);
    			}

    			an.showFunFact = true;
    		}

    		$$invalidate(1, filteredAnimals = [...filteredAnimals]);
    	}

    	function loadMore() {
    		$$invalidate(2, displayCount = Math.min(displayCount + 3, filteredAnimals.length));
    	}

    	onMount(() => {
    		loadDatabaseImages();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Database> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		searchQuery = this.value;
    		$$invalidate(0, searchQuery);
    	}

    	const click_handler = i => handleDbPlay(i);
    	const click_handler_1 = an => toggleFunFact(an);

    	const keydown_handler = (an, e) => {
    		if (e.key === "Enter" || e.key === " ") toggleFunFact(an);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		fade,
    		scale,
    		animals,
    		getMimeType,
    		fetchUnsplashImage,
    		fetchAnimalFunFact,
    		searchQuery,
    		filteredAnimals,
    		displayCount,
    		loadDatabaseImages,
    		filterAnimals,
    		refreshDatabase,
    		handleDbPlay,
    		toggleFunFact,
    		loadMore
    	});

    	$$self.$inject_state = $$props => {
    		if ('searchQuery' in $$props) $$invalidate(0, searchQuery = $$props.searchQuery);
    		if ('filteredAnimals' in $$props) $$invalidate(1, filteredAnimals = $$props.filteredAnimals);
    		if ('displayCount' in $$props) $$invalidate(2, displayCount = $$props.displayCount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		searchQuery,
    		filteredAnimals,
    		displayCount,
    		filterAnimals,
    		refreshDatabase,
    		handleDbPlay,
    		toggleFunFact,
    		loadMore,
    		input_input_handler,
    		click_handler,
    		click_handler_1,
    		keydown_handler
    	];
    }

    class Database extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Database",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/pages/Highscores.svelte generated by Svelte v3.59.2 */
    const file = "src/pages/Highscores.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (32:4) {:else}
    function create_else_block(ctx) {
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let tbody;
    	let each_value = /*highscoreData*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Modus";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Spieler";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Punkte";
    			t5 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(th0, "class", "svelte-1nymuj8");
    			add_location(th0, file, 35, 12, 1013);
    			attr_dev(th1, "class", "svelte-1nymuj8");
    			add_location(th1, file, 36, 12, 1040);
    			attr_dev(th2, "class", "svelte-1nymuj8");
    			add_location(th2, file, 37, 12, 1069);
    			add_location(tr, file, 34, 10, 996);
    			add_location(thead, file, 33, 8, 978);
    			add_location(tbody, file, 40, 8, 1126);
    			attr_dev(table, "class", "svelte-1nymuj8");
    			add_location(table, file, 32, 6, 962);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t1);
    			append_dev(tr, th1);
    			append_dev(tr, t3);
    			append_dev(tr, th2);
    			append_dev(table, t5);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(tbody, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*highscoreData*/ 1) {
    				each_value = /*highscoreData*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(32:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (30:4) {#if highscoreData.length === 0}
    function create_if_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Noch keine Einträge";
    			add_location(p, file, 30, 6, 917);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(30:4) {#if highscoreData.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (42:10) {#each highscoreData as entry}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*entry*/ ctx[2].mode + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*entry*/ ctx[2].player + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*entry*/ ctx[2].score + "";
    	let t4;
    	let t5;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			attr_dev(td0, "class", "svelte-1nymuj8");
    			add_location(td0, file, 43, 14, 1206);
    			attr_dev(td1, "class", "svelte-1nymuj8");
    			add_location(td1, file, 44, 14, 1242);
    			attr_dev(td2, "class", "svelte-1nymuj8");
    			add_location(td2, file, 45, 14, 1280);
    			add_location(tr, file, 42, 12, 1187);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*highscoreData*/ 1 && t0_value !== (t0_value = /*entry*/ ctx[2].mode + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*highscoreData*/ 1 && t2_value !== (t2_value = /*entry*/ ctx[2].player + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*highscoreData*/ 1 && t4_value !== (t4_value = /*entry*/ ctx[2].score + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(42:10) {#each highscoreData as entry}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let h2;
    	let t1;

    	function select_block_type(ctx, dirty) {
    		if (/*highscoreData*/ ctx[0].length === 0) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Highscores";
    			t1 = space();
    			if_block.c();
    			add_location(h2, file, 28, 4, 854);
    			attr_dev(div, "class", "container svelte-1nymuj8");
    			add_location(div, file, 27, 2, 826);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Highscores', slots, []);
    	let highscoreData = [];

    	onMount(() => {
    		loadHighscores();
    	});

    	function loadHighscores() {
    		$$invalidate(0, highscoreData = []);

    		// Scanne localStorage nach Keys => "highscore_classic_" oder "highscore_timed_"
    		for (let i = 0; i < localStorage.length; i++) {
    			const key = localStorage.key(i);

    			if (key.startsWith("highscore_")) {
    				const score = parseInt(localStorage.getItem(key), 10);

    				highscoreData.push({
    					mode: key.includes("timed") ? "Zeitmodus" : "Klassik",
    					player: key.replace("highscore_classic_", "").replace("highscore_timed_", ""),
    					score
    				});
    			}
    		}

    		highscoreData.sort((a, b) => b.score - a.score); // Absteigend sortieren
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Highscores> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ onMount, highscoreData, loadHighscores });

    	$$self.$inject_state = $$props => {
    		if ('highscoreData' in $$props) $$invalidate(0, highscoreData = $$props.highscoreData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [highscoreData];
    }

    class Highscores extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Highscores",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */

    function create_fragment(ctx) {
    	let navigation;
    	let t;
    	let router;
    	let current;
    	navigation = new Navigation({ $$inline: true });

    	router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(navigation.$$.fragment);
    			t = space();
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(navigation, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navigation.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navigation.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navigation, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	const routes = {
    		"/": Home,
    		"/quiz": Quiz,
    		"/database": Database,
    		"/highscores": Highscores
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Navigation,
    		Router,
    		Home,
    		Quiz,
    		Database,
    		Highscores,
    		routes
    	});

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
