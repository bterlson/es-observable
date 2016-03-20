import { testMethodProperty } from "./helpers.js";

export default {

    "SubscriptionObserver.prototype has an next method" (test, { Observable }) {

        let observer;
        new Observable(x => { observer = x }).subscribe({});

        testMethodProperty(test, Object.getPrototypeOf(observer), "next", {
            configurable: true,
            writable: true,
            length: 1
        });
    },

    "Input value" (test, { Observable }) {

        let token = {};

        new Observable(observer => {

            observer.next(token);

        }).subscribe({

            next(value) {
                test._("Input value is forwarded to the observer")
                .equals(value, token);
            }
        });
    },

    "Subscription argument" (test, { Observable }) {

        let values = [], subscriptionArg;

        let subscription = new Observable(observer => {

            observer.next(1);
            observer.next(2);

        }).subscribe({

            next(value, sub) {
                subscriptionArg = sub;
                values.push(value);
                sub.unsubscribe();
            }
        });

        test
        ._("Subscription object is provided as second argument to next")
        .assert(subscription === subscriptionArg)
        ._("Next is not called after subscription is cancelled")
        .equals(values, [1]);
    },

    "Return value" (test, { Observable }) {

        let token = {};

        new Observable(observer => {

            test._("Returns the value returned from the observer")
            .equals(observer.next(), token);

            observer.complete();

            test._("Returns undefined when closed")
            .equals(observer.next(), undefined);

        }).subscribe({
            next() { return token }
        });
    },

    "Method lookup" (test, { Observable }) {

        let observer,
            observable = new Observable(x => { observer = x });

        observable.subscribe({});
        test._("If property does not exist, then next returns undefined")
        .equals(observer.next(), undefined);

        observable.subscribe({ next: undefined });
        test._("If property is undefined, then next returns undefined")
        .equals(observer.next(), undefined);

        observable.subscribe({ next: null });
        test._("If property is null, then next returns undefined")
        .equals(observer.next(), undefined);

        observable.subscribe({ next: {} });
        test._("If property is not a function, then an error is thrown")
        .throws(_=> observer.next(), TypeError);

        let actual = {};
        observable.subscribe(actual);
        actual.next = (_=> 1);
        test._("Method is not accessed until complete is called")
        .equals(observer.next(), 1);

        let called = 0;
        observable.subscribe({
            get next() {
                called++;
                return function() {};
            }
        });
        observer.complete();
        observer.next();
        test._("Method is not accessed when subscription is closed")
        .equals(called, 0);

        called = 0;
        observable.subscribe({
            get next() {
                called++;
                return function() {};
            }
        });
        observer.next();
        test._("Property is only accessed once during a lookup")
        .equals(called, 1);

    },

    "Cleanup functions" (test, { Observable }) {

        let called, observer;

        let observable = new Observable(x => {
            observer = x;
            return _=> { called++ };
        });

        called = 0;
        observable.subscribe({ next() { throw new Error() } });
        try { observer.next() }
        catch (x) {}
        test._("Cleanup function is called when next throws an error")
        .equals(called, 1);

        let error = new Error(), caught = null;

        new Observable(x => {
            observer = x;
            return _=> { throw new Error() };
        }).subscribe({ next() { throw error } });

        try { observer.next() }
        catch (x) { caught = x }

        test._("If both next and the cleanup function throw, then the error " +
            "from the next method is thrown")
        .assert(caught === error);

    },

};
