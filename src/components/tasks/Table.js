import React from 'react';
import { findDOMNode } from 'react-dom'
import { Link } from 'react-router-dom'

import {Tooltip} from 'react-tippy';

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Motion, spring } from 'react-motion';

import * as Actions from '../../actions'
import blender_logo from './../../assets/img/blender_logo.png'
import { convertSecsToHMS, timeStampToHR } from './../../utils/secsToHMS'

import InsufficientAmountModal from './modal/InsufficientAmountModal'

const mapStateToProps = state => ({
    taskList: state.realTime.taskList,
    isEngineOn: state.info.isEngineOn,
    connectedPeers: state.realTime.connectedPeers,
    psEnabled: state.preview.ps.enabled,
    psId: state.preview.ps.id,
})

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(Actions, dispatch)
})


const status = Object.freeze({
    WAITINGFORPEER: 'Waiting for peer',
    NOTREADY: 'Not started',
    READY: 'Ready',
    WAITING: 'Waiting',
    COMPUTING: 'Computing',
    FINISHED: 'Finished',
    TIMEOUT: 'Timeout',
    RESTART: 'Restart'
})

function shouldPSEnabled(_item){
            return (_item.status == status.COMPUTING                        || 
                    _item.status == status.FINISHED                         || 
                    (_item.status == status.TIMEOUT && _item.progress > 0)  ||
                    (_item.status == status.RESTART && _item.progress > 0))
        }

/**
 * { Class for Table Component in Blender Component }
 *
 * @class      Table (name)
 */
export class Table extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            insufficientAmountModal: false
        }

        this._handleDeleteTask = ::this._handleDeleteTask
        this._fetchStatus = ::this._fetchStatus
    }

    componentWillUpdate(nextProps, nextState) {
        if (nextProps.taskList !== this.props.taskList) {
            this.updateFooterInfoBar(nextProps.taskList)
        }

        //# avoid from updating state on render cycle, previewLock mechanism moved here
        if (nextProps.previewId !== this.props.previewId) 
            this.selectedItem = nextProps.taskList.filter( item => item.id === nextProps.previewId)[0]

        if(this.selectedItem && 
            (nextProps.psEnabled !== shouldPSEnabled(this.selectedItem) ||
             nextProps.previewId !== this.props.psId))

            this.props.actions.updatePreviewLock({
                id: this.selectedItem.id,
                frameCount: this.selectedItem.options.frame_count,
                enabled: shouldPSEnabled(this.selectedItem)
            })
    }

    /**
     * [_navigateTo func. signifies selected navigation item]
     * @param  {Event}  evt
     */
    _navigateTo(evt) {
        let taskItems = document.getElementsByClassName('task-item');
        [].map.call(taskItems, (item) => {
            item.classList.remove('active')
        });

        evt && evt.currentTarget.classList.add('active')
    }

    /**
     * [_handleRowClick func. sends information of the clicked task as callback]
     * @param  {Event}      event
     * @param  {Object}     item    [Clicked task object]
     * @param  {Number}     Index   [Index of selected task]
     * @return {Boolean}
     */
    _handleRowClick(event, item, index) {
        const {id, preview, options} = item

        this._navigateTo(event)
        this.props.previewHandler({
            id: id,
            src: preview
        })


        return true
    }

    /**
     * [_handleDeleteModal sends information of the clicked task as callback]
     * @param  {Any}        id      [Id of the selected task]
     */
    _handleDeleteModal(id) {
        this.props.deleteModalHandler(id, this._handleDeleteTask)
    }


    /**
     * [_handleDeleteTask func. deletes selected task]
     * @param  {Any}        id      [Id of the selected task]
     */
    _handleDeleteTask(id) {
        const {actions, previewHandler} = this.props
        //console.log("DELETED_TASK", id)
        actions.deleteTask(id)

        previewHandler({
            id: null,
            src: null
        })

        this._navigateTo(null)

        actions.updatePreviewLock({
                id: null,
                frameCount: null,
                enabled: false
            })
    }

    /**
     * [_handleDeleteModal sends information of the clicked task as callback]
     * @param  {Any}        id      [Id of the selected task]
     */
    _handleRestart(id) {
        this._restartAsync(id)
            .then((_result) => {
                if(_result && !_result[0] && _result[1].includes("Not enough")){
                    console.warn("Task restart failed!")
                    this.setState({
                        insufficientAmountModal: true
                    })
                }
            })
    }

    _restartAsync(id){
        return new Promise((resolve, reject)=> {
            this.props.actions.restartTask(id, resolve, reject)
        })
    }

    _closeModal(){
        this.setState({
            insufficientAmountModal: false
        })
    }

    /**
     * [_fetchStatus func. populate status of the task]
     * @param  {Object}     item    [Task item]
     * @return {DOM}                [Element of the status]
     */
    _fetchStatus(item) {

        switch (item.status) {
        case status.TIMEOUT:
            return <span className="duration duration--done">Timeout</span>

        case status.NOTREADY:
            return <span className="duration duration--active">Preparing...</span>

        case status.WAITING:
            return <span className="duration duration--active">Waiting...</span>

        case status.RESTART:
            return <span className="duration duration--done">Restarted</span>

        case status.COMPUTING:
            return <span className="duration duration--active">{convertSecsToHMS(item.duration)} Duration</span>

        default:
            return <span className="duration duration--done">{timeStampToHR(item.time_started)} | {item.status}</span>
        }
    }

    /**
     * [updateFooterInfoBar func. updates information about the task status on footer info bar]
     * @param  {Array}    data    [JSON array of task list]
     */
    updateFooterInfoBar(data) {
        const {actions, connectedPeers} = this.props
        let waiting = data.some(item => item.status == status.WAITING)
        let computing = data.some(item => item.status == status.COMPUTING)
        let timeout = data.some(item => item.status == status.TIMEOUT)
        
        let info = connectedPeers ?
        {
            status: status.READY,
            message: "Golem is ready!",
            color: 'green'
        } : 
        {
            status: status.WAITINGFORPEER,
            message: "Waiting for peer...",
            color: 'yellow'
        }
        if (waiting) {
            info.status = status.WAITING
            info.message = "Task is preparing for computation"
            info.color = 'yellow'
        }
        if (computing) {
            info.status = status.COMPUTING
            info.message = "Processing your task"
            info.color = "green"
        }
        if (timeout) {
            info.status = status.TIMEOUT
            info.message = "Your task has timed out"
            info.color = "red"
        }
      
        actions.setFooterInfo(info)

    }

    /**
     * {listTasks function}
     * @param  {Array}    data    [JSON array of task list]
     * @return {Object}           [DOM of task list]
     *
     * @description [React-Motion]  https://github.com/chenglou/react-motion
     * React motion provides animation ability to elements.
     * Variable which will change with a rule, defining as a default style prop.
     * Result we want to get is defining as style prop with spring helper
     * {spring}
     *     @param {int}     stiffness   (optional)
     *     @param {int}     damping     (optional)
     *     @param {float}   precision   (optional)
     */
    listTasks(data) {
        const listItems = data
        .map((item, index) => Motion && <Motion key={index.toString()} defaultStyle={{
                progress: 0
            }} style={{
                progress: spring(item.progress, {
                    stiffness: 50,
                    damping: 7
                })
            }} role="listItem" tabIndex="-1">
            {value => <div className="wrapper-task-item"><div className="task-item" style={{
                    background: item.progress < 1 ? `linear-gradient(90deg, #E3F3FF ${value.progress * 100}%, transparent ${value.progress * 100}%)` : 'transparent'
                }} onClick = { e => this._handleRowClick(e, item, index)} >
                <div className="info__task-item" tabIndex="0" aria-label="Task Preview">
                    <div>
                        <span className={`task-icon icon-${item.type.toLowerCase()}`}>
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                        </span>
                    </div>
                    <div>
                        <h4>{item.name}</h4>
                        {this._fetchStatus(item)}
                    </div>
                </div>
                <div>
                    {item.status == status.TIMEOUT && <Tooltip
                      html={<p>Restart</p>}
                      position="bottom"
                      trigger="mouseenter">
                        <span className="icon-reload" tabIndex="0" aria-label="Restart Task" onClick={this._handleRestart.bind(this, item.id)}></span>
                    </Tooltip>}
                    <Tooltip
                      html={<p>Delete</p>}
                      position="bottom"
                      trigger="mouseenter">
                        <span className="icon-trash" tabIndex="0" aria-label="Open Delete Task Popup" onClick={this._handleDeleteModal.bind(this, item.id)}></span>
                </Tooltip>
                    <Link to={`/task/${item.id}`} tabIndex="0" aria-label="Task Details"><span className="icon-arrow-right"></span></Link>
                </div>
            </div></div>}
            </Motion>
        );

        return (
            <div className="task-list">{data.length > 0 && listItems}</div>
        )
    }

    render() {
        const {taskList} = this.props
        const {insufficientAmountModal} = this.state
        return (
            <div role="list">
                {taskList && this.listTasks(taskList)}
                {insufficientAmountModal && <InsufficientAmountModal closeModal={::this._closeModal}/>}
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Table)
