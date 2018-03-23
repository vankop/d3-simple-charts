import * as d3 from 'd3';
export const BAR_CHART_TRANSITION_DURATION = 750;
export const PIE_CHART_TRANSITION_DURATION = 1300;

export const lazyArgument = func => ({
    toString: func
});

export const colorRange = d3.schemeCategory20;
