import * as d3 from 'd3';
import popup from './popup';
export const BAR_CHART_TRANSITION_DURATION = 750;
export const PIE_CHART_TRANSITION_DURATION = 1300;

export const lazyArgument = func => ({
    toString: func
});

export const colorRange = d3.schemeCategory20;

export function createMouseEnterHandler({
    animate,
    handleMouseLeave,
    positionSelector,
    popupsContainer,
    colorSelector,
    seriesSelector
}) {
    return function mouseEnter(el, index) {
        if (!this._popup) {
            const {
                data,
                name
            } = seriesSelector(el);

            animate.call(this, el, index);

            this._popup = popup(
                popupsContainer,
                name,
                data,
                positionSelector(el, index),
                colorSelector(el, index),
                handleMouseLeave.bind(this)
            );
        }
    }
}

export function createMouseLeaveHandler(animate) {
    return function mouseLeave() {
        if (this._popup) {
            if (!this._popup.isEventTarget(d3.event.relatedTarget)) {
                animate.call(this);

                if (this._popup) {
                    this._popup.remove();
                    this._popup = null;
                }
            }
        }
    }
}
