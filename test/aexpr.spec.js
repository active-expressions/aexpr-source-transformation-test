'use strict';

import {reset} from 'aexpr-source-transformation-propagation';

describe('Propagation Logic', function() {

    it('is a transparent wrapper for property accesses', () => {
        let obj = {
            prop: 42,
            func(mul) { return this.prop * mul}
        };

        expect(obj.prop).to.equal(42);
        expect(obj.func(2)).to.equal(84);

        obj.prop /= 3;

        expect(obj.prop).to.equal(14);
        expect(obj.func(2)).to.equal(28);
    });

    it('should be supported with proper integration', () => {
        let obj = { prop: 42 },
            spy = sinon.spy();

        aexpr(() => obj.prop).onChange(spy);

        expect(spy).not.to.be.called;

        obj.prop = 17;

        expect(spy).to.be.calledOnce;
    });

    it('should recalculate to recognize latest changes', () => {
        let obj = {
                prop: 'a',
                a: 15,
                b: 32
            },
            spy = sinon.spy();

        aexpr(() => obj[obj.prop]).onChange(spy);

        obj.a = 17;

        expect(spy.withArgs(17)).to.be.calledOnce;

        obj.prop = 'b';

        expect(spy.withArgs(32)).to.be.calledOnce;

        obj.a = 42;

        expect(spy.withArgs(42)).not.to.be.called;

        obj.b = 33;

        expect(spy.withArgs(33)).to.be.calledOnce;
    });

    it('applies the given operator', () => {
        let obj = {
                a: 5
            },
            spy = sinon.spy();

        aexpr(() => obj.a).onChange(spy);

        obj.a *= 1;

        expect(spy).not.to.be.called;

        obj.a += 2;

        expect(spy.withArgs(7)).to.be.calledOnce;
    });

    it('retain the this reference semantic', () => {
        let obj = {
                a: 5,
                func() {
                    return this.a * 3;
                }
            },
            spy = sinon.spy();

        aexpr(() => obj.func()).onChange(spy);

        obj.a = 1;

        expect(spy.withArgs(3)).to.be.calledOnce;
    });

    it('reset all active expressions', () => {
        let obj = { prop: 42 },
            spy = sinon.spy();

        aexpr(() => obj.prop).onChange(spy);

        reset();

        obj.prop = 17;

        expect(spy).not.to.be.called;
    });

    describe('parametrizable aexprs', () => {

        it('handles a single instance binding', () => {
            let _scope = {};
            let obj = { val: 17 },
                spy = sinon.spy();

            aexpr(o => o.val, obj).onChange(spy);

            expect(spy).not.to.be.called;

            obj.val = 42;

            expect(spy).to.be.calledOnce;
        });

        it("handle aexprs with one instance binding with multiple variables", () => {
            let obj1 = { val: 1 },
                obj2 = { val: 2 },
                obj3 = { val: 3 },
                spy = sinon.spy();

            aexpr((o1, o2, o3) => o1.val + o2.val + o3.val, obj1, obj2, obj3).onChange(spy);

            expect(spy).not.to.be.called;

            obj1.val = 10;

            expect(spy.withArgs(15)).to.be.calledOnce;

            obj2.val = 20;

            expect(spy.withArgs(33)).to.be.calledOnce;
        });

        it("handle aexprs with multiple instance bindings", () => {
            let obj1 = { val: 1 },
                obj2 = { val: 2 },
                obj3 = { val: 3 },
                spy12 = sinon.spy(),
                spy23 = sinon.spy(),
                expr = (o1, o2) => o1.val + o2.val;

            aexpr(expr, obj1, obj2).onChange(spy12);
            aexpr(expr, obj2, obj3).onChange(spy23);

            expect(spy12).not.to.be.called;
            expect(spy23).not.to.be.called;

            obj1.val = 10;

            expect(spy12.withArgs(12)).to.be.calledOnce;
            expect(spy23).not.to.be.called;

            obj2.val = 20;

            expect(spy12.withArgs(30)).to.be.calledOnce;
            expect(spy23.withArgs(23)).to.be.calledOnce;

            obj3.val = 30;

            expect(spy12.withArgs(30)).to.be.calledOnce;
            expect(spy23.withArgs(50)).to.be.calledOnce;
        });
    });

    describe('locals', () => {

        it('is a transparent wrapper for local variables', () => {
            var x = 0, y = 1, z = 2;

            let func, inc;
            {
                let x = 42;
                func = function() {
                    return x;
                };
                inc = function() {
                    x += 1;
                };
            }

            expect(func()).to.equal(42);

            x = 17;

            expect(x).to.equal(17);
            expect(func()).to.equal(42);

            inc();

            expect(x).to.equal(17);
            expect(func()).to.equal(43);
        });

        it('should be supported with proper integration', () => {
            let value = 17,
                spy = sinon.spy();

            aexpr(() => value).onChange(spy);

            expect(spy).not.to.be.called;

            value = 42;

            expect(spy).to.be.calledOnce;
        });

        it('should recalculate to recognize latest changes', () => {
            let obj = { a: 15 },
                obj2 = obj,
                spy = sinon.spy();

            aexpr(() => obj.a).onChange(spy);

            obj.a = 17;

            expect(spy.withArgs(17)).to.be.calledOnce;

            obj = { a: 32 };

            expect(spy.withArgs(32)).to.be.calledOnce;

            obj2.a = 42;

            expect(spy.withArgs(42)).not.to.be.called;

            obj.a = 33;

            expect(spy.withArgs(33)).to.be.calledOnce;
        });

        it('reset all active expressions', () => {
            let value = 42,
                spy = sinon.spy();

            aexpr(() => value).onChange(spy);

            reset();

            value = 17;

            expect(spy).not.to.be.called;
        });
    });

    describe('globals', () => {
        it('interacts with member accesses on global object', () => {
            window.globalValue = 17;
            let spy = sinon.spy();

            aexpr(() => globalValue).onChange(spy);

            expect(spy).not.to.be.called;

            globalValue = 33;

            expect(spy.withArgs(33)).to.be.calledOnce;

            window.globalValue = 42;

            expect(spy).to.be.calledWithMatch(42);
        });

        it('should be supported with proper integration', () => {
            window.globalValue = 17;
            let spy = sinon.spy();

            aexpr(() => globalValue).onChange(spy);

            expect(spy).not.to.be.called;

            globalValue = 42;

            expect(spy).to.be.calledOnce;
        });

        it('reset all active expressions', () => {
            globalValue = 42;
            let spy = sinon.spy();

            aexpr(() => globalValue).onChange(spy);

            reset();

            globalValue = 17;

            expect(spy).not.to.be.called;
        });
    });
});
