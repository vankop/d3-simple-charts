import React, { Component } from 'react';
import { times } from 'lodash';
import BarChart from './BarChart';
import PieChart from './PieChart';

const data = times(20, index => ({
    id: index,
    value: Math.round(Math.random() * 200)
}));

class App extends Component {
  render() {
    return (
      <div className="App">
        <BarChart
            data={data}
            width={900}
            height={400}
        />
        <PieChart
            data={data}
            width={500}
            height={500}
        />
      </div>
    );
  }
}

export default App;
