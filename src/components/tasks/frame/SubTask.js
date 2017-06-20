import React from 'react';
import ReactTooltip from 'rc-tooltip'

import convertSecsToHMS from './../../../utils/secsToHMS'

const UNDONE = 0
const PROGRESS = 1
const DONE = 2

const subTaskData = {
    key: '0',
    data: {
        status: 0,
        duration: 1206
    }
}
export default class SubTask extends React.Component {

    constructor(props) {
        super(props);
    }


    drawLine() {
        const {data} = this.props

        var path = Object.keys(data).map(function(anchestorKey) {
            return Object.keys(data[anchestorKey]).map(function(parentKey) {
                return Object.keys(data[anchestorKey][parentKey]).map(function(childKey) {
                    return data[anchestorKey][parentKey][childKey] * 2.52
                });
            });
        });

        console.log()

        function flatten(arr) {
            return [].concat(...arr).toString().replace(/(,[^,]*),/g, '$1 ')
        }

        /**
         * [offset func. finding max right and bottom points of the polyline]
         * @param  {[Array]}    arr    [Array of the path item]
         * @return {[Array]}            [Array for the max right point and max bottom point]
         *
         * @description This function will be modified for the non-square shapes
         */
        function offset(arr) {
            arr = [].concat(...[].concat(...arr)).sort().reverse()
            let uniq = a => [...new Set(a)];
            arr = uniq(arr)
            return arr.slice(0, 2)
        }

        return path.map((item, index) => <ReactTooltip
            key={index.toString()}
            overlayClassName="tooltip-frame"
            placement="bottom"
            trigger={['hover']}
            mouseEnterDelay={1}
            overlay={<div className="content__tooltip">
                        {index === DONE && <p className="status__tooltip">Completed</p>}
                        <p className={`time__tooltip ${index === DONE && 'time__tooltip--done'}`}>{convertSecsToHMS(subTaskData.data.duration)}</p>
                        <button>Resubmit</button>
                    </div>}
            align={{
                offset: [(offset(item)[0] / 2), 20],
            }}  arrowContent={<div className="rc-tooltip-arrow-inner"></div>}>
                <polyline key={index.toString()} fill="transparent" stroke="black"
            points={flatten(item)}/>
            </ReactTooltip>
        )
    }

    render() {
        return (
            <div id="frameCanvas">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            {this.drawLine()}
        </svg>
      </div>
        );
    }
}