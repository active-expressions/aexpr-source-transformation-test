'use strict';

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
});
