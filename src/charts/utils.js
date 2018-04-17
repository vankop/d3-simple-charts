import * as d3 from 'd3';

import popup from './popup';

export const AREA_CHART_TRANSITION_DURATION = 750;
export const PIE_CHART_TRANSITION_DURATION = 1300;

export const lazyArgument = func => ({
    toString: func
});

export const colorRange = d3.schemeCategory20;

export function createMouseEnterHandler({
    animate,
    handleMouseLeave,
    positionLeftSelector,
    positionRightSelector,
    popupsContainer,
    colorSelector,
    seriesSelector,
    isXInScope
}) {
    return function mouseEnter(el, index) {
        if (!this._popup) {
            const {
                data,
                name
            } = seriesSelector(el);

            animate.call(this, el, index);

            this._popup = popup({
                node: popupsContainer,
                serieName: name,
                serieInfo: data,
                coordLeft: positionLeftSelector.call(this, el, index),
                coordRight: positionRightSelector.call(this, el, index),
                color: colorSelector.call(this, el, index),
                onMouseLeave: handleMouseLeave.bind(this),
                isXInScope
            });
        }
    };
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
    };
}

export function XYChartYScale(minMax, height, min) {
    const { max: maxValue, min: minValue } = minMax();

    const diff = maxValue - minValue;
    const top = minValue + (diff / 0.8);
    const bottom = minValue - (diff / 4);

    return d3.scaleLinear()
        .domain([min === true ? (bottom > 0 ? bottom : 0) : (min || 0), top])
        .range([height, 0]);
}

function textXPosition() {
    return -10 - this.textContent.length;
}

export function transformAxeTextPosition(axe) {
    axe
        .selectAll('text')
        .attr('x', textXPosition)
        .attr('transform', 'rotate(-40)');
}
