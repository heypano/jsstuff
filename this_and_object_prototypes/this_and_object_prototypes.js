// Reading Book at https://github.com/getify/You-Dont-Know-JS/tree/master/this%20%26%20object%20prototypes


$(document).ready(function () {
    /* Chapter 1 */
    // showcaseCallingThis();
    /* Chapter 2 */
    softBind();
    nestedFunctions();
    weirdSemicolon();
    nestedFunctionsInObject();
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
 * Rules to figure out what this refers to (after finding the call-site)
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
 *  Avoid recursive stack overflows by using setTimeout(func, 0);
 */

function softBind(){
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
}

function nestedFunctions(){
    a();
    function a(){
        b();
    }
    function b(){
        c();
    }
    function c(){
        console.log("this still refers to window, even though it's nested (no object)", this);
    }
}

function nestedFunctionsInObject(){
    var obj = new Object();
    obj.a = a;
    obj.a();

    function a(){
        console.log("In obj.a() this is (the object)", this);
        b();
    }
    function b(){
        console.log("In b() (through obj.a()) this is (window)", this);
        c();
    }
    function c(){
        console.log("In c() (through obj.a()) this is (window)", this);
    }
}

function weirdSemicolon(){
    console.log("noNewLine after 'return' returns: ", noNewLine());
    console.log("newLine after 'return' returns: ", newLine());
    function noNewLine(){
        return {
            objectProperty : "blarg"
        };
    }
    function newLine(){
        return
        {
          objectProperty : "blorg"
        };
    }
}

/***** Chapter 3 - Objects *****/

/**
 * - Objects come in two forms: the declarative (literal) form, and the constructed form. {} vs new
 *   DO NOT use the constructed form for build-in objects
 *
 * - 6 primary types: string, number, boolean, null, undefined, object
 *   Simple primitives [string, number, boolean, null, undefined] ARE NOT objects
 *   null is sometimes referred to as an object type, but this misconception stems from a bug in the language
 *   which causes typeof null to return the string "object" incorrectly (and confusingly). In fact, null is its own primitive type.
 *
 * - Complex primitives
 *   * Functions sub-type of object (callable object)
 *   Every time you access a property on an object, that is a property access, regardless of the type of value you get back.
 *   If you happen to get a function from that property access, it's not magically a "method" at that point.
 *   There's nothing special (outside of possible implicit this binding as explained earlier) about a function that comes from a property access.
 *   * Arrays
 *
 * - Built in objects
 *   * String, Number, Boolean, Object, Function, Array, Date, RegExp, Error
 *   - string is not the same as String - "bla" is not of type [object String], but of type "string"
 *   - the language automatically coerces a "string" primitive to a String object when necessary
 *   - null and undefined have no object wrapper form, only their primitive values
 *   - Objects, Arrays, Functions, and RegExps (regular expressions) are all objects regardless of whether the literal or constructed form is used.
 *   - Sometimes the constructed form has more options - only use it when those are needed
 *   - Error objects are created when an exception is thrown
 *
 * - the contents of an object consist of values (any type) stored at specifically named locations, which we call properties. [implementation specific - might not be part of the object]
 * - The .a syntax is usually referred to as "property" access, whereas the ["a"] syntax is usually referred to as "key" access. The former requires a valid Identifier property name
 * - Property names are always strings
 * - ES6 adds computed property names, where you can specify an expression, surrounded by a [ ] pair, in the key-name position of an object-literal declaration:
 *   var myObject = {
 *       [prefix + "bar"]: "hello",
 *       [prefix + "baz"]: "world"
 *   };
 *   ES6 symbols are also very useful for this
 *
 * - Calling something a method vs a property in javascript is arbitrary (main difference is that "this" is set but that depends on how it's called)
 * - ES6 adds a "super" reference which will be used with "class". super will have a static binding
 *
 * - Arrays
 *   * Arrays assume non-negative integer indexing
 *   * Arrays are Objects, so you can add arbitrary properties as well, but the length will remain the same
 *
 * - Duplicating Objects
 *   * One solution: JSON.parse( JSON.stringify( someObj ) ); if object is JSON safe
 *   * ES6 has a solution for shallow copies (Object.assign)
 *
 * - Property descriptors (also sometimes called data descriptors)
 *   * All properties have a property descriptor since ES5 (Object.getOwnPropertyDescriptor - writable, enumerable, configurable, getters, setters)
 *   * Use Object.defineProperty(..) to add a new property or modify it if it's configurable
 *       Object.defineProperty( myObject, "a", {
 *           value: 2,
 *           writable: true,
 *           configurable: true,
 *           enumerable: true
 *       } );
 *   * writable: If strict mode is use, when a property is not writable and you try to set it you get a TypeError
 *   * configurable: You can/cannot modify its descriptor definition (regardless of strict mode) (writable can still be made false, once). Also will prevent delete if set to false
 *   * enumberable: controls if a property will show up in certain object-property enumerations, such as the for..in loop
 *   * Immutability - Shallow immutability is supported (referenced objects can still be changed)
 *       - Constant: writable:false and configurable:false makes a property like a constant
 *       - Prevent Extensions (new properties): Object.preventExtensions(..): (In non-strict fails quietly, in strict throws error)
 *       - Seal: Prevents extensions and marks all properties configurable:false (Object.seal)
 *       - Freeze: Seals and marks all "data accessor" properties as writable:false
 *
 *   ** Property access **
 *   --[[Get]]
 *       - [[Get]]() is what happens on property access
 *       - [[Get]] first inspects the objects for a property name and returns the value if it finds it. If it does not find it it traverses the [[Prototype]] chain, if any.
 *         If it does not find a value, it returns the value undefined. This is different from variables.
 *         If a variables identifier name cannot be resolved within the applicable lexical scope it throws a ReferenceError.
 *       - Inspecting only the value results, you cannot distinguish whether a property exists and holds the explicit value undefined
 *   --[[Put]]
 *       - [[Put]] behavior differs based on a number of factors (most importantly whether it's already present or not)
 *       - If the property is present:
 *           1) Is it an accessor descriptor? If yes, call the setter
 *           2) Is it a data descriptor with writable:false? Throw error if strict mode, silent no-op otherwise
 *           3) Set the value as normal
 *       - If it's not present... Will explain in chapter 5 ([[Prototype]])
 *
 *   - Getters are properties which actually call a hidden function to retrieve a value. Setters are properties which actually call a hidden function to set a value.
 *   - There are currently no ways to make getters/setters for the entire object, but it might be possible soon. Just properties for now
 *   - When a property has either a defined getter or a setter or both, its definition becomes an "accessor descriptor" (vs a data descriptor)
 *   - For accessor descriptors, the value and writable characteristics are moot and ignored (instead uses set and get characteristics)
 *   - Getters/Setters : Either through object-literal syntax with get a() { .. } / set a() { .. }  or through explicit definition with defineProperty(..),
 *       var myObject = {
 *           // define a getter for `a`
 *           get a() {
 *               return 2;
 *           }
 *       };
 *
 *       Object.defineProperty(
 *           myObject,   // target
 *           "b",        // property name
 *           {           // descriptor
 *               // define a getter for `b`
 *               get: function(){ return this.a * 2 },
 *
 *               // make sure `b` shows up as an object property
 *               enumerable: true
 *           }
 *       );
 *
 *       myObject.a; // 2
 *       myObject.b; // 4
 *
 *
 *       var myObject = {
 *           // define a getter for `a`
 *           get a() {
 *               return this._a_;
 *           },
 *
 *           // define a setter for `a`
 *           set a(val) {
 *               this._a_ = val * 2;       // Convention
 *           }
 *        };
 *
 *   - Checking Existence
 *     * The in operator will check to see if the property is in the object, or if it exists at any higher level of the [[Prototype]] chain object traversal
 *     * hasOwnProperty(..) checks to see if only myObject has the property or not, and will not consult the [[Prototype]] chain
 *     * it's possible to create an object that does not link to Object.prototype via Object.create(null)
 *       In that scenario, a more robust way of performing such a check is Object.prototype.hasOwnProperty.call(myObject,"a")
 *
 *   - Enumeration
 *
 *     var myObject = { };
 *
 *     Object.defineProperty(
 *         myObject,
 *         "a",
 *         // make `a` enumerable, as normal
 *         { enumerable: true, value: 2 }
 *     );
 *
 *     Object.defineProperty(
 *         myObject,
 *         "b",
 *         // make `b` NON-enumerable
 *         { enumerable: false, value: 3 }
 *     );
 *
 *     myObject.b; // 3
 *     ("b" in myObject); // true
 *     myObject.hasOwnProperty( "b" ); // true
 *
 *     // .......
 *
 *     for (var k in myObject) {
 *         console.log( k, myObject[k] );
 *     }
 *     // "a" 2
 *
 *   - Do not use for/in for arrays because it will list other properties as well
 *   - Object.propertyIsEnumerable
 *   - Object.keys(..) returns an array of all enumerable properties, whereas Object.getOwnPropertyNames(..) returns an array of all properties, enumerable or not.
 *   - Whereas in vs. hasOwnProperty(..) differ in whether they consult the [[Prototype]] chain or not, Object.keys(..) and Object.getOwnPropertyNames(..) both inspect only the direct object specified.
 *   - Currently no way to list all properties including prototypes etc
 *
 *   - Iteration
 *
 *     Iterating over values in arrays: forEach(), every() and some()
 *     * forEach(..) will iterate over all values in the array, and ignores any callback return values
 *     * every(..) keeps going until the end or the callback returns a false (or "falsy") value
 *     * some(..) keeps going until the end or the callback returns a true (or "truthy") value.
 *     - These special return values inside every(..) and some(..) act somewhat like a break statement inside a normal for loop, in that they stop the iteration early before it reaches the end.
 *
 *     - Order of properties in object is not set
 *     - ES6 adds for/of for (var value of myArray) to iterate trough values directly (uses @@iterator object and .next())
 *
 *     var myArray = [ 1, 2, 3 ];
 *     var it = myArray[Symbol.iterator](); // Returns the iterator object
 *
 *     it.next(); // { value:1, done:false }
 *     it.next(); // { value:2, done:false }
 *     it.next(); // { value:3, done:false }
 *     it.next(); // { done:true }
 *
 *     - Define your own iterator
 *
 *     Object.defineProperty( myObject, Symbol.iterator, {
 *         enumerable: false,
 *         writable: false,
 *         configurable: true,
 *         value: function() {
 *             var o = this;
 *             var idx = 0;
 *             var ks = Object.keys( o );
 *             return {
 *                 next: function() {
 *                     return {
 *                         value: o[ks[idx++]],
 *                         done: (idx > ks.length)
 *                     };
 *                 }
 *             };
 *         }
 *     } );
 *
 *    - using the Symbol as a computed property name (covered earlier in this chapter), we could have declared it directly
 *      like var myObject = { a:2, b:3, [Symbol.iterator]: function(){ / .. / } }.
 *    - You can make infinite iterators, but not use for/of unless you break manually
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

function s(text){
    $("#result").html($("#result").html()+"<br>"+text);
}