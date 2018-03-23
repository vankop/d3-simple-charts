import * as d3 from 'd3';
export const TRANSITION_DURATION = 750;

export const lazyArgument = func => ({
    toString: func
});

export const colorRange = d3.schemeCategory20;
