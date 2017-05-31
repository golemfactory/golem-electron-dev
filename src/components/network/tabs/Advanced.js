import React from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as Actions from '../../../actions'

import RadialProgress from './../../RadialProgress'
import Dropdown from './../../Dropdown'

const mockSystemInfo = {
    num_cores: 3,
    max_memory_size: 3145728,
    max_resource_size: 10240000
}

const mapStateToProps = state => ({
    systemInfo: state.advanced.systemInfo,
    presetList: state.advanced.presetList,
    chosenPreset: state.advanced.chosenPreset,
    chartValues: state.advanced.chartValues
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
        this._handleOptionChange(presetList, chosenPreset)

    }

    _handleInputChange(key, evt) {
        const {actions, chartValues} = this.props
        actions.setAdvancedManually({
            ...chartValues,
            [key]: evt.target.value
        })
        actions.setResources(this.calculateResourceValue({
            ...chartValues,
            [key]: evt.target.value
        }))
    }

    _handleOptionChange(list, name) {
        const {actions} = this.props
        let value = list.filter((item, index) => item.name == name)[0]
        if (value) {
            actions.setChosenPreset(value.name)
            actions.setAdvancedChart({
                ...value
            });
            actions.setResources(this.calculateResourceValue(value))
        }
    }

    calculateResourceValue({cpu_cores, memory, disk}) {
        const {systemInfo} = this.props
        let cpuRatio = (cpu_cores / systemInfo.cpu_cores)
        let ramRatio = (memory / systemInfo.memory)
        let diskRatio = (disk / systemInfo.disk)
        return 100 * ((cpuRatio + ramRatio + diskRatio) / 3)
    }

    fillOption(list) {
        return list.map((item, index) => <option key={index.toString()} value={item.name}>{item.name}</option>)
    }

    _handleSavePresetModal(data) {
        this.props.modalHandler(data)
    }

    render() {
        const {presetList, chosenPreset, manageHandler, systemInfo, chartValues} = this.props
        let {cpu_cores, memory, disk} = chartValues
        return (
            <div className="content__advanced">
            <div className="quick-settings__advanced">
              <Dropdown list={presetList} selected={presetList.map(item => item.name).indexOf(chosenPreset)} handleChange={this._handleOptionChange.bind(this, presetList)} manageHandler={manageHandler}  presetManager/>
              <button className="btn--outline" onClick={this._handleSavePresetModal.bind(this, {
                cpu_cores,
                memory,
                disk
            })}>Save as Preset</button>
            </div>
            <div className="section__radial-options">
              <div className="item__radial-options">
                <RadialProgress pct={cpu_cores} title="CPU" max={systemInfo.cpu_cores}/>
                <input type="number" min="0" step="1" max={systemInfo.cpu_cores} onChange={this._handleInputChange.bind(this, 'cpu_cores')} value={cpu_cores}/>
              </div>
              <div className="item__radial-options">
                <RadialProgress pct={memory} title="RAM" max={systemInfo.memory}/>
                <input type="number" min="0" step="128" max={systemInfo.memory} onChange={this._handleInputChange.bind(this, 'memory')} value={memory}/>
              </div>
              <div className="item__radial-options">
                <RadialProgress pct={disk} title="Disk" max={systemInfo.disk}/>
                <input type="number" min="0" step="1" max={systemInfo.disk} onChange={this._handleInputChange.bind(this, 'disk')} value={disk}/>
              </div>
            </div>
            <div className="advanced__tips">
              <span>Allocate your machine’s resources exactly as you like. Remember that if you give Golem all of your processing power you will not be  able to use it at the same time.</span>
            </div>
          </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Advanced)
