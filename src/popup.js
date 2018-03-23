import * as d3 from 'd3';
import { max } from 'lodash';

import { legendCircleTextPadding, legendInfoRadius } from './legend';

const extraHeight = 30;
const border = 1;
const paddingInRect = 5;
const baseWidth = 80;

/**
 * @param {HTMLElement} node
 * @param {string} serieName
 * @param {string} serieInfo
 * @param {[number, number]} coord
 * @param {string} color
 * @param {function} onMouseLeave
 * @return {Object}
 */
export default function popup(node, serieName, serieInfo, coord, color, onMouseLeave) {
    const popup = node
        .append('g')
            .attr('transform', `translate(${coord})`);

    const rect = popup
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('fill', '#fff')
        .attr('stroke', '#000')
        .attr('height', legendInfoRadius * 2 + extraHeight + border)
        .attr('width', baseWidth + max([serieName.length, serieInfo.length]));

    const circle = popup
        .append('circle')
        .attr('fill', color)
        .attr('cx', legendInfoRadius + paddingInRect)
        .attr('cy', legendInfoRadius + paddingInRect)
        .attr('r', legendInfoRadius);

    const name = popup
        .append('text')
        .attr('font-family', 'sans-serif')
        .attr('font-size', '14px')
        .attr('x', 2 * legendInfoRadius + paddingInRect + legendCircleTextPadding)
        .attr('y', 2 * legendInfoRadius + paddingInRect)
        .text(serieName);

    const info = popup
        .append('text')
        .attr('font-family', 'sans-serif')
        .attr('font-size', '14px')
        .attr('x', paddingInRect)
        .attr('y', 2 * legendInfoRadius + extraHeight + paddingInRect - 10)
        .text(serieInfo);

    const isPopupContent = (domNode) => {
        let result = false;

        rect.each(function () {
            if (this === domNode) {
                result = true;
            }
        });

        if (result) {
            return result;
        }

        name.each(function () {
            if (this === domNode) {
                result = true;
            }
        });

        if (result) {
            return result;
        }

        info.each(function () {
            if (this === domNode) {
                result = true;
            }
        });

        if (result) {
            return result;
        }

        circle.each(function () {
            if (this === domNode) {
                result = true;
            }
        });

        return result;
    };

    const handleMouseLeave = () => {
        if (!isPopupContent(d3.event.relatedTarget)) {
            onMouseLeave()
        }
    };

    rect.on('mouseleave', handleMouseLeave);
    name.on('mouseleave', handleMouseLeave);
    info.on('mouseleave', handleMouseLeave);
    circle.on('mouseleave', handleMouseLeave);

    return {
        isEventTarget: isPopupContent,
        remove: () => popup.remove()
    };
}
