import React from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as Actions from '../../../actions'

import RadialProgress from './../../RadialProgress'
import Dropdown from './../../Dropdown'

const mockSystemInfo = {
    num_cores: 3,
    max_memory_size: 3145728,
    max_resource_size: 10 * 1048576
}

const min = {
    cpu_cores: 1,
    memory: 1048576,
    disk: 1048576
}

const preset = Object.freeze({
    CUSTOM: 'custom'
})

const mapStateToProps = state => ({
    systemInfo: state.advanced.systemInfo,
    presetList: state.advanced.presetList,
    chosenPreset: state.advanced.chosenPreset,
    chartValues: state.advanced.chartValues,
    isEngineOn: state.info.isEngineOn
})

const mapDispatchToProps = dispatch => ({
    actions: bindActionCreators(Actions, dispatch)
})

export class Advanced extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const {presetList, chosenPreset} = this.props
        this._handleOptionChange(presetList, chosenPreset, true)
    }

    /**
     * [_handleInputChange func. If there's any change on input, the func. will update state]
     * @param  {Any}        key         [State key]
     * @param  {Event}      evt
     */
    _handleInputChange(key, evt) {
        const {actions, chartValues} = this.props
        actions.setAdvancedManually({
            ...chartValues,
            [key]: evt.target.value || 0,
            name: preset.CUSTOM
        })
        actions.setResources(this.calculateResourceValue({
            ...chartValues,
            [key]: evt.target.value
        }))
    }

    /**
     * [_handleOptionChange func. will update adnvanced chart if there's any change on dropdown]
     * @param  {Array}          list        [List of dropdown]
     * @param  {String}         name        [Name of selected option]
     * @param  {String}         init        [Initial loading: true, personal choose: false]
     */
    _handleOptionChange(list, name, init = false) {
        const {actions, chartValues} = this.props
        let value = list.filter((item, index) => item.name == name)[0]
        if (value) {
            actions.setChosenPreset(value.name, init)
            actions.setAdvancedChart({
                ...value
            });
            !init && actions.setResources(this.calculateResourceValue(value))
        }
    }

    /**
     * [calculateResourceValue func.]
     * @param  {Int}        options.cpu_cores       [Selected cpu core amount]
     * @param  {Int}        options.memory          [Selected memory amount]
     * @param  {Int}        options.disk            [Selected disk space amount]
     * @return {Int}                                [Mean of their percentage]
     */
    calculateResourceValue({cpu_cores, memory, disk}) {
        const {systemInfo} = this.props
        let cpuRatio = (this.clampResource(cpu_cores, systemInfo, 'cpu_cores') / systemInfo.cpu_cores)
        let ramRatio = (this.clampResource(memory, systemInfo, 'memory') / systemInfo.memory)
        let diskRatio = (this.clampResource(disk, systemInfo, 'disk') / systemInfo.disk)
        return 100 * ((cpuRatio + ramRatio + diskRatio) / 3)
    }

    /**
     * [fillOption func. will populate dropdown from Redux store]
     * @param  {Array}      list        [List of hardware presets]
     * @return {DOM}                    [option elements for the select list]
     */
    fillOption(list) {
        return list.map((item, index) => <option key={index.toString()} value={item.name}>{item.name}</option>)
    }

    /**
     * [_handleSavePresetModal func. will open save preset modal]
     * @param  {Object}     data    [Custom hardware preset object]
     */
    _handleSavePresetModal(data) {
        this.props.modalHandler(data)
    }

    /**
     * [clampResource returns a value limited to given resource name bounds]
     *
     * @param  {Number} val   [Given resource value]
     * @param  {Object} upper [Object with upper bounds]
     * @param  {String} name  [Name of the resource]
     * @return {Number}       [A number in the range [min, systemInfo]]
     *
     * @credit https://stackoverflow.com/a/11409944/3805131
     */
    clampResource(val, upper, name) {
        return Math.min(Math.max(this, min[name]), upper[name]);
    };

    render() {
        const {presetList, chosenPreset, manageHandler, systemInfo, chartValues, isEngineOn} = this.props
        let {cpu_cores, memory, disk} = chartValues
        return (
            <div className="content__advanced">
            <div className="quick-settings__advanced">
              <Dropdown list={presetList} selected={presetList.map(item => item.name).indexOf(chosenPreset)} handleChange={this._handleOptionChange.bind(this, presetList)} manageHandler={manageHandler}  presetManager disabled={isEngineOn}/>
              <button className="btn--outline" onClick={this._handleSavePresetModal.bind(this, {
                cpu_cores,
                memory,
                disk
            })} disabled={isEngineOn}>Save as Preset</button>
            </div>
            <div className="section__radial-options">
              <div className="item__radial-options">
                <RadialProgress pct={cpu_cores} title="CPU" max={systemInfo.cpu_cores} warn={true} disabled={isEngineOn}/>
                <input type="number" min={min.cpu_cores} step="1" max={systemInfo.cpu_cores} onChange={this._handleInputChange.bind(this, 'cpu_cores')} value={this.clampResource(cpu_cores, systemInfo, 'cpu_cores')} disabled={isEngineOn}/>
              </div>
              <div className="item__radial-options">
                <RadialProgress pct={memory} title="RAM" max={systemInfo.memory} warn={true} disabled={isEngineOn}/>
                <input type="number" min={min.memory} step="1024" max={systemInfo.memory} onChange={this._handleInputChange.bind(this, 'memory')} value={this.clampResource(memory, systemInfo, 'memory')} disabled={isEngineOn}/>
              </div>
              <div className="item__radial-options">
                <RadialProgress pct={disk} title="Disk" max={systemInfo.disk} warn={true} disabled={isEngineOn}/>
                <input type="number" min={min.disk} step="1024" max={systemInfo.disk} onChange={this._handleInputChange.bind(this, 'disk')} value={this.clampResource(disk, systemInfo, 'disk')} disabled={isEngineOn}/>
              </div>
            </div>
            <div className="advanced__tips">
              <span>Allocate your machine’s resources exactly as you like. Remember that if you give Golem all of your processing power you will not be able to use it at the same time.</span>
            </div>
          </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Advanced)
