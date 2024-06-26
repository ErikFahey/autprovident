/* @@name @@version @@date
* @@description
* @@repository.url
*
* by Andrea Carraro
* Available under the MIT license
*/

/*jslint browser: true*/
/*jshint -W093 */

;(function ( window, document, undefined ) {

    /*
    * The first time Offside is called, it creates a singleton-factory object
    * and place it into "window.offside.factory".
    *
    * Offside factory serves the following purposes:
    * - DOM initialization
    * - Centralized Offside instances management and initialization
    */

    'use strict';

    // Self-invoking function returning the object which contains
    // the "getInstance" method used for initializing
    // the Offside sigleton factory
    var offside = (function () {

        // Global Offside singleton-factory constructor
        function initOffsideFactory( options ) {

            // Utility functions
            // Shared among factory and Offside instances, too

            // Close all open Offsides.
            // If an Offside instance id is provided, it just closes the matching instance instead
            var closeOpenOffside = function( offsideId ) {

                // Look for an open Offside id
                if ( openOffsidesId.length > 0 ) {

                    // Close matching Offside instance if an ID is provided
                    if( !isNaN( offsideId ) ) {

                        instantiatedOffsides[ offsideId ].close();
                    } else {

                        // Close all Offside instances 
                        forEach( openOffsidesId, function( offsideId ){
                            instantiatedOffsides[ offsideId ].close();
                        });
                    }

                }
            },

            // Append a class to body in order to turn on elements CSS 3D transitions
            // only when happens the first interation with an Offside instance.
            // Otherwise we would see Offside instances being smoothly pushed
            // out of the screen during DOM initialization.
            turnOnCssTransitions = function() {
                addClass( body, transitionsClass );
            },

            addClass = function( el, c ) {
                if ( el.classList ) {
                    el.classList.add(c);
                } else {
                    el.className = ( el.className + ' ' + c ).trim();
                }
            },

            removeClass = function( el, c ) {
                if ( el.classList ) {
                    el.classList.remove(c);
                } else {
                    el.className = el.className.replace( new RegExp( '(^|\\b)' + c.split(' ').join('|') + '(\\b|$)', 'gi' ), ' ' );
                }
            },

            addEvent = function( el, eventName, eventHandler ) {
                el.addEventListener( eventName, eventHandler );
            },

            removeEvent = function( el, eventName, eventHandler ) {
                el.removeEventListener( eventName, eventHandler );
            },

            // Return a DOM element from:
            // - A string selector
            // - An array of elements
            // - An element
            getDomElements = function( elements, single ) {

                // "elements" is DOM element or array
                // Watch out: typeof null === 'object'
                if( elements !== null && typeof elements === 'object' ) {

                    if( 'nodeType' in elements || isArray( elements ) ) {
                        return elements;
                    }
                // "elements" is a string selector
                } else if( typeof elements === 'string' && elements !== '' ) {

                    return single === true ?
                        document.querySelector( elements ) :
                        document.querySelectorAll( elements );
                }

                return false;
            },

            isArray = function( el ) {
                return Object.prototype.toString.call( el ) === '[object Array]' ? true : false;
            },

            // Check if a value exists in an array. Returns:
            // - array index if value exists
            // - "false" if value is not found
            // See: http://stackoverflow.com/a/5767357
            isInArray = function( array, value ) {
                var index = array.indexOf( value );
                return index > -1 ? index : false;
            },

            //forEach method shared
            forEach = function( array, fn ) {
                for ( var i = 0; i < array.length; i++ ) {
                    fn( array[i], i );
                }
            };

            // Offside.js factory initialization

            var i,
                factorySettings;                                    // Offside factory private settings

            // Default factory settings
            factorySettings = {

                slidingElementsSelector: '.offside-sliding-element',    // String: Default sliding elements selectors ('#foo, #bar')
                disableCss3dTransforms: false,                          // Disable CSS 3d Transforms support (for testing purposes)
                debug: false,                                           // Boolean: If true, print errors in console
            };

            // User defined factory settings
            for ( i in options ) {
                if ( factorySettings.hasOwnProperty( i ) ) {
                    factorySettings[i] = options[i];
                }
            }

            // Private factory properties
            var globalClass = 'offside-js',                         // Global Offside classes namespace
                initClass = globalClass + '--init',                 // Class appended to body when Offside is intialized
                slidingElementsClass = 'offside-sliding-element',   // Class appended to sliding elements
                transitionsClass = globalClass + '--interact',      // Class appended to body when ready to turn on Offside CSS transitions (Added when first menu interaction happens)
                instantiatedOffsides = [],                          // Array containing all instantiated offside elements
                firstInteraction = true,                            // Keep track of first Offside interaction
                has3d = factorySettings.disableCss3dTransforms ? false : _has3d(),       // Browser supports CSS 3d Transforms
                openOffsidesId = [],                                // Tracks opened Offside instances id's
                body = document.body,
                slidingElements = getDomElements( factorySettings.slidingElementsSelector ),     // Sliding elements
                debug = factorySettings.debug;

            // Offside singleton-factory Dom initialization
            // It's called just once on Offside singleton-factory init.
            function _factoryDomInit() {

                // Add class to sliding elements
                forEach( slidingElements, function( item ){
                    addClass( item, slidingElementsClass );
                });

                // DOM Fallbacks when CSS transform 3d not available
                if ( !has3d ) {
                    // No CSS 3d Transform fallback
                    addClass( document.documentElement, 'no-csstransforms3d' ); //Adds Modernizr-like class to HTML element when CSS 3D Transforms not available
                }

                // Add init class to body
                addClass( body, initClass );
            }

            // Private Offside factory methods

            // Testing for CSS 3D Transform Support
            // https://gist.github.com/lorenzopolidori/3794226
            function _has3d() {
                var el = document.createElement('p'),
                has3d,
                transforms = {
                    'webkitTransform':'-webkit-transform',
                    'OTransform':'-o-transform',
                    'msTransform':'-ms-transform',
                    'MozTransform':'-moz-transform',
                    'transform':'transform'
                };

                // Add it to the body to get the computed style
                document.body.insertBefore(el, null);

                for( var t in transforms ){
                    if( el.style[t] !== undefined ){
                        el.style[t] = 'translate3d(1px,1px,1px)';
                        has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
                    }
                }

                document.body.removeChild(el);

                return ( has3d !== undefined && has3d.length > 0 && has3d !== 'none' );
            }

            // Offside constructor wrapper
            // It supplies a wrapper around OffsideInstance constructor
            // to prevent instance initialization when casted on a non-existing DOM element
            // See: http://stackoverflow.com/a/8618792
            function createOffsideInstance( el, options, offsideId ) {

                // Check if provided element exists before using it to instantiate an Offside instance
                var domEl = el !== undefined ?
                    getDomElements( el, true ) :
                    getDomElements( '.offside', true );

                // If provided el exists initialize an Offside instance, else return null
                return domEl !== false ?
                    new OffsideInstance( domEl, options, offsideId ) :
                    null;
            }

            // Offside constructor
            // Set up and initialize a new Offside instance
            // Called by Offside factory "getOffsideInstance()" method
            function OffsideInstance( domEl, options, offsideId ) {

                var i,
                    offsideSettings;

                // Default Offside instance settings
                offsideSettings = {

                    buttonsSelector: '',                // String: Offside toggle buttons selectors ('#foo, #bar')
                    slidingSide: 'left',                // String: Offside element pushed on left or right
                    init: function(){},                 // Function: After init callback
                    beforeOpen: function(){},           // Function: Before open callback
                    afterOpen: function(){},            // Function: After open callback
                    beforeClose: function(){},          // Function: Before close callback
                    afterClose: function(){},           // Function: After close callback
                    beforeDestroy: function(){},        // Function: After destroy callback
                    afterDestroy: function(){},         // Function: After destroy callback
                };

                // User defined Offside instance settings
                for ( i in options ) {
                    if ( offsideSettings.hasOwnProperty( i ) ) {
                        offsideSettings[i] = options[i];
                    }
                }

                // Offside instance private properties
                var offside = domEl,                                                        // Hello, I'm the Offside instance
                    offsideButtons = getDomElements( offsideSettings.buttonsSelector ),     // Offside toggle buttons 
                    slidingSide = offsideSettings.slidingSide,
                    offsideClass = 'offside',                                               // Class added to Offside instance when initialized
                    offsideSideClass = offsideClass + '--' + slidingSide,                   // Class added to Offside instance when initialized (eg. offside offside--left)
                    offsideOpenClass = 'is-open',                                           // Class appended to Offside instance when open
                    offsideBodyOpenClass = globalClass + '--' + 'is-open',                  // Class appended to body when an Offside instance is open (offside-js--is-open)
                    offsideBodyOpenSideClass = globalClass + '--is-' + slidingSide,         // Class appended to body when Offside instance is open (eg. offside-js--is-left / offside-js--is-open)
                    id = offsideId || 0;                                                           // Offside instance id

                // Offside instance private methods

                var _toggleOffside = function() {

                    // Premise: Just 1 Offside instance at time can be open.

                    // Check currently toggling Offside status
                    isInArray( openOffsidesId, id ) === false ? _openOffside() : _closeOffside();
                },

                _openOffside = function() {

                    // beforeOpen callback
                    offsideSettings.beforeOpen();

                    // Turn on CSS transitions on first interaction with an Offside instance
                    if ( firstInteraction ) {
                        firstInteraction = false;
                        turnOnCssTransitions();
                    }

                    // If another Offside instance is already open,
                    // close it before going on
                    closeOpenOffside();

                    // Set global body active class for current Offside instance
                    addClass( body, offsideBodyOpenClass );
                    addClass( body, offsideBodyOpenSideClass );

                    // Add Offside instance open class
                    addClass( offside, offsideOpenClass );

                    // Update open Offside instances tracker
                    openOffsidesId.push( id );

                    // afterOpen callback
                    offsideSettings.afterOpen();
                },

                _closeOffside = function() {

                    // Proceed with closing stuff only if
                    // current Offside instance is listed among openOffsidesId array
                    var index = isInArray( openOffsidesId, id );

                    if( index !== false ) {

                        // beforeClose callback
                        offsideSettings.beforeClose();

                        // Remove global body active class for current Offside instance
                        removeClass( body, offsideBodyOpenClass );
                        removeClass( body, offsideBodyOpenSideClass );

                        // Remove Offside instance open class
                        removeClass( offside, offsideOpenClass );

                        // Update open Offside instances tracker
                        openOffsidesId.splice( index, 1 );

                        // afterClose callback
                        offsideSettings.afterClose();
                    }
                },

                _closeAllOffside = function() {

                    closeOpenOffside();
                },

                _destroyOffside = function() {

                    // beforeDestroy callback
                    offsideSettings.beforeDestroy();

                    //Close Offside intance before destroy
                    _closeOffside();

                    // Remove click event from Offside buttons
                    forEach( offsideButtons, function( item ) {
                        removeEvent( item, 'click', _onButtonClick );
                    });

                    // Destroy Offside instance
                    delete instantiatedOffsides[id];

                    // afterDestroy callback
                    offsideSettings.afterDestroy();
                },

                // Offside buttons click handler
                _onButtonClick = function( e ) {

                    e.preventDefault();
                    _toggleOffside();
                },

                /*
                // Get Offside instance unique ID
                _getId = function() {
                    return id;
                }
                */
               
                // Set up and initialize a new Offside instance
                _offsideInit = function() {

                    if ( debug ) {
                        _offsideCheckElements();
                    }

                    //Add classes to Offside instance (.offside and .offside{slidingSide})
                    addClass( offside, offsideClass );
                    addClass( offside, offsideSideClass );

                    // Toggle Offside on click event
                    forEach( offsideButtons, function( item ) {
                        addEvent( item, 'click', _onButtonClick );
                    });

                    // Init callback
                    offsideSettings.init();
                },

                // Fire console errors if DOM elements are missing
                _offsideCheckElements = function() {

                    if ( !offside ) {
                        console.error( 'Offside alert: "offside" selector could not match any element' );
                    }

                    if ( !offsideButtons.length ) {
                        console.error( 'Offside alert: "buttonsSelector" selector could not match any element' );
                    }
                };

                // Offside instances public methods
                this.toggle = function() {
                    _toggleOffside();
                };

                this.open = function() {
                    _openOffside();
                };

                this.close = function() {
                    _closeOffside();
                };

                this.closeAll = function() {
                    _closeAllOffside();
                };

                this.destroy = function() {
                    _destroyOffside();
                };

                // Ok, init Offside instance
                _offsideInit();

            } // OffsideInstance constructor end


            // DOM initialization
            _factoryDomInit();

            // This is the actual returned Offside factory
            return {

                //Offside factory public methods
                closeOpenOffside: function() {
                    closeOpenOffside();
                },

                // This is the method responsible for creating a new Offside instance
                // and register it into "instantiatedOffsides" array
                getOffsideInstance: function( el, options ) {

                        // Get length of instantiated Offsides array
                    var offsideId = instantiatedOffsides.length || 0,

                        // Instantiate new Offside instance
                        offsideInstance = createOffsideInstance( el, options, offsideId );

                    // If Offside instance is sccessfully created
                    if ( offsideInstance !== null ) {

                        // Push new instance into "instantiatedOffsides" array and return it
                        return instantiatedOffsides[ offsideId ] = offsideInstance;
                    }


                }

            };

        } // initOffsideFactory() end

        return {

            // Get the Singleton instance if one exists
            // or create one if it doesn't
            getInstance: function ( el, options ) {

                if ( !window.offside.factory ) {
                    window.offside.factory = initOffsideFactory( options );
                }

                return window.offside.factory.getOffsideInstance( el, options );
            }
        };
     
    })();

    // Store in window a reference to the Offside singleton factory
    if ( typeof module !== 'undefined' && module.exports ) {
        module.exports = offside.getInstance;
    } else {
        window.offside = offside.getInstance;
    }

})( window, document );