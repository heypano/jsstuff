// Reading Book at https://github.com/getify/You-Dont-Know-JS/tree/master/this%20%26%20object%20prototypes


$(document).ready(function () {
    /* Chapter 1 */
    showcaseCallingThis();
});

/***** Chapter 1 *****/

/**
 *  - this is automatically defined in the scope of every function
 *
 *  - To reference a function object from inside itself, it has to be a named function / assigned to a variable (avoid anonymous functions)
 *    Don't use arguments.callee
 *
 *  - this does not refer to a function's lexical scope. Internally, scope is kind of like an object with properties for each of the available identifiers.
 *    But the scope "object" is not accessible to JavaScript code. It's an inner part of the Engine's implementation.
 *
 *  - this is a runtime binding. nothing to do with where a function is declared, but has instead everything to do with the manner in which the function is called.
 *
 *  - When a function is invoked, an activation record, otherwise known as an execution context, is created.
 *    This record contains information about where the function was called from (the call-stack), how the function was invoked, what parameters were passed, etc.
 *    One of the properties of this record is the this reference which will be used for the duration of that function's execution.
 */

function showcaseCallingThis(){
    var me = {
      name: "Pano"
    };
    var you = {
      name: "Other person"
    };

    speak.call( me );
    speak.call( you );

    function identify() {
        return this.name.toUpperCase();
    }

    function speak() {
        var greeting = "Hello, I'm " + identify.call( this );
        s( greeting );
    }
}

/***** Chapter 2 *****/

/**
 * - Finding the call-site is generally: "go locate where a function is called from", but it's not always that easy, as certain coding patterns can obscure the true call-site.
 *
 * - What's important is to think about the call-stack. The "call-site" we care about is in the invocation before the currently executing function
 *
 * - You can use the debugger; statement to force execution to pause and debug
 *
 * - Function callbacks often lose their implicit binding
 *
 * Rules to figure out what this refers to
 *
 * 1) Default binding
 *    - If a function is called with an undecorated reference, then this refers to the window object OR "undefined" if "use strict"
 *    - the global object is only eligible for the default binding if the contents of foo() are not running in strict mode; the strict mode state of the call-site of foo() is irrelevant.
 *
 * 2) Implicit binding
 *    - does the call-site have a context object, also referred to as an owning or containing object?
 *    - Only the top/last level of an object property reference chain matters to the call-site
 *      In obj1.obj2.foo(), this in foo refers to obj2
 *
 *    2.1) Implicitly Lost
 *    - When an implicitly bound function loses the binding, this falls back to teh default binding (window / undefined depending on strict mode)
 *      e.g. var bar = obj.foo; bar();
 *      In foo() this will refer to window/undefined and not obj
 *
 * 3) Explicit Binding
 *    - call and apply methods
 *    - If you pass a simple primitive value as the this binding, it is wrapped in its object-form (new String(..), new Boolean(..), or new Number(..), respectively).
 *      This is often referred to as "boxing".
 *    3.1) Hard Binding
 *    - Wrap a function and define its context (e.g. bind in plain js, lang.hitch in dojo, $.proxy in jQuery)
 *    - As of ES6, the hard-bound function produced by bind(..) has a .name property that derives from the original target function.
 *      For example: bar = foo.bind(..) should have a bar.name value of "bound foo", which is the function call name that should show up in a stack trace.
 *
 *    * API call contexts
 *    -  A lot of APIs will provide a "context" parameter that will set the "this" variable for you without having to call bind (e.g. forEach
 *
 * 4) new binding
 *    - In JS, constructors are just functions that happen to be called with the new operator in front of them.
 *      They are not attached to classes, nor are they instantiating a class. They are not even special types of functions.
 *      They're just regular functions that are, in essence, hijacked by the use of new in their invocation.
 *      Conclusion : There aren't really any "constructor" functions, but more so, constructor function calls
 *
 *    - When you call new, these things happen
 *      1) New object is created
 *      2) [[Prototype]] is linked to the new object
 *      3) the object is set as "this" for that function call
 *      4) Unless the function returns its own alternate object, the new-invoked function call will automatically return the new object
 *
 * ** Rule Priority **
 *   new > explicit > implicit > default
 *
 *   Why is new being able to override hard binding useful?
 *   The primary reason for this behavior is to create a function (that can be used with new for constructing objects) that essentially ignores the this hard binding
 *   but which presets some or all of the function's arguments. One of the capabilities of bind(..) is that any arguments passed after the first this binding argument
 *   are defaulted as standard arguments to the underlying function (technically called "partial application", which is a subset of "currying").
 *
 * ** Exceptions **
 *
 *   1) If you pass null or undefined as a this binding parameter to call, apply, or bind, those values are effectively ignored (default binding rule applies).
 *   - ES6 has the ... spread operator which will let you syntactically "spread out" an array as parameters without needing apply(..), such as foo(...[1,2]), which amounts to foo(1,2)
 *   - there's a slight hidden "danger" in always using null when you don't care about the this binding.
 *     If you ever use that against a function call (for instance, a third-party library function that you don't control), and that function does make a this reference,
 *     the default binding rule means it might inadvertently reference (or worse, mutate!) the global object (window in the browser).
 *     ** Safer this **
 *     - pass a specifically set up object which is guaranteed not to be an object that can create problematic side effects in your program (DMZ - De Militarized Zone)
 *       Object.create(null) is similar to { }, but without the delegation to Object.prototype, so it's "more empty" than just { }.
 *       Suggestion: name DMZ object as ø
 *   2) Indirection
 *   - (p.foo = o.foo)(); // Global binding
 *   3) Softening binding (Default binding but not hard)
 *   - It would be nice if there was a way to provide a different default for default binding (not global or undefined)
 *     while still leaving the function able to be manually this bound via implicit binding or explicit binding technique
 *   4) ES6: Arrow-functions are signified not by the function keyword, but by the => so called "fat arrow" operator.
 *      Instead of using the four standard this rules, arrow-functions adopt the this binding from the enclosing (function or global) scope.
 *      The arrow-function created in foo() lexically captures whatever foo()s this is at its call-time. This cannot be overriden even with new()
 *      This will be very useful for callbacks
 *
 * While self = this and arrow-functions both seem like good "solutions" to not wanting to use bind(..), they are essentially fleeing from this instead of understanding and embracing it.
 *
 *
 */
if (!Function.prototype.softBind) {
    Function.prototype.softBind = function(obj) {
        var fn = this,
            curried = [].slice.call( arguments, 1 ),
            bound = function bound() {
                return fn.apply(
                    (!this ||
                        (typeof window !== "undefined" &&
                        this === window) ||
                        (typeof global !== "undefined" &&
                        this === global)
                    ) ? obj : this,
                    curried.concat.apply( curried, arguments )
                );
            };
        bound.prototype = Object.create( fn.prototype );
        return bound;
    };
}

function s(text){
    $("#result").html($("#result").html()+"<br>"+text);
}