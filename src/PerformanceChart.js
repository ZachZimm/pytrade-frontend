import {csv, timeFormat} from "d3"
import React, {useEffect, useState,} from 'react';
import useMeasure from 'react-use-measure'
import {defaultStyles, useTooltip, TooltipWithBounds} from "@visx/tooltip"
import {scaleLinear, scaleTime} from "@visx/scale"
import {extent, bisector} from "d3-array"
import { Group } from "@visx/group";
import { Line, LinePath, Bar } from "@visx/shape";
import { curveMonotoneX, curveCardinal, curveCardinalClosed, curveNatural, curveBasis } from "@visx/curve";
import { localPoint } from "@visx/event"
import { Axis, AxisBottom, AxisLeft } from "@visx/axis";
import styled from "styled-components";
import $, { data } from 'jquery'

const startingBal = 500
const startingPrice = 83.8

const tickLabelProps = () => ({
    fill: "#a6a6a6",
    fontSize: 11,
    fontFamily: "sans-serif",
    label: "%"
  });

const getYValue = (d) => (d['price']/startingPrice);
const getYValue2 = (d) => (d['balance']/startingBal);
const getNewValue = (d) => (d['Close']/startingPrice);
const getNewValue2 = (d) => (((d['Close'] * d['avax_bal']) + d['usd_bal'])/startingBal);

const getXValue = (d) => { return new Date(d['Date']) }
 
const bisectDate = bisector(getXValue).left;

const Wrapper = styled.div`
  
`;

const tooltipStyles = {
    ...defaultStyles,
    borderRadius: 4,
    background: "#1976d2",
    color: "white",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  };

  const accessors = {
    xAccessor: d => d['Date'],
    yAccessor: d => d['price'],
  };


const PerformanceChart = () => {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState([])
    const [newData, setNewData] = useState([])
    const [ref, bounds] = useMeasure()
    const {showTooltip, hideTooltip,tooltipData,tooltipLeft,tooltipTop} =  useTooltip();

    // const width = bounds.width || 100;
    // const height = bounds.height || 100;
    const width = 900
    const height = 400

    const get_strategy_data = async () =>{

        var current = new Date()
        var dateEntry = current.getFullYear() + "-" +
                    (current.getUTCMonth()+1) + "-" + 
                    current.getUTCDate() + " " +
                    current.getUTCHours() + ":" +
                    current.getMinutes() + ":" +
                    current.getSeconds() + "." +
                    current.getMilliseconds()
        var new_entry = {
            Date: dateEntry, 
            price: newData.Close,
            balance: (newData.avax_bal * newData.Close) + newData.usd_bal
        }

        csv('http://71.94.94.154:8080/strategy_log').then( (d) => {
            d.map((d) => {
                let new_date = (d['Date'].split('.')[0])
                d['Date'] = new_date
                d['price'] = Number(d['price'])
            })
            d.push(new_entry)
            console.log(new_entry['Date'])
            
            // console.log(dateEntry)
            // d['Date'] = [...d['Date'], dateEntry]
            // d['balance'] = [...d['balance'],((newData.avax_bal * newData.Close) + newData.usd_bal)]
            // d['price'] = [...d['price'],newData.Close]
            // d['Date'].push(String(dateEntry))
            // d['price'].push(newData.Close)
            // d['balance'].push((newData.avax_bal * newData.Close) + newData.usd_bal)
            
            

            setData(d) 
            // setData(d.slice(-100))
            setLoading(false)
        })

        

        setTimeout(get_strategy_data,150000) // Check for new data in 2.5 minutes and cause chart to re-render
    }

    const get_new_data = async () => {
        var request = '/data' // This should be passed in as an arg
		// var sub = window.origin.split(':') // For use when frontend, backend, and client are on the same network, sometimes
		// var uri = sub[0] +':'+ sub[1]

		// Maybe do if(origin == localhost) {}
		var uri = 'http://71.94.94.154:8080' + request
		// console.log(origin)
		
		$.getJSON(uri, function(data){
			// console.log("Response: ", data)
			setNewData(data)
		})
        await new Promise(r => setTimeout(r, 2000));
        setTimeout(get_new_data, 5000) // Check for new data in 5 seconds
    }

    useEffect(() => {
		if(loading === true)
		{
            get_new_data()
            
			get_strategy_data()
		}
        console.log('-')
        console.log(newData)
		console.log(data)
        console.log('-')
		// query()
	}, [data]);

    if(loading) return <div><h2>Loading...</h2></div>

    const xScale = scaleTime({
        range: [0, width],
        domain: extent(data,getXValue)
    }, [data])

    const yScale = scaleLinear({
        range: [height, 0],
        domain: [
            Math.min(Math.min(...data.map(getYValue2))-.025 ,Math.min(...data.map(getYValue))-.025),
            Math.max(Math.max(...data.map(getYValue2))+.025 ,Math.max(...data.map(getYValue))+.025),
        ],
    },[data])

    return (
        <Wrapper>
            <svg ref={ref} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
                <Group>
                    <LinePath
                        data={data}
                        key={(d) => `bar-${getXValue(d)}`}
                        x={(d) => xScale(getXValue(d)) ?? 0}
                        y={(d) => yScale(getYValue(d)) ?? 0}
                        stroke="#F5D482"
                        strokeWidth={2}
                        curve={curveMonotoneX}

                    />
                    <LinePath
                        data={data}
                        key={Math.random()}
                        x={(d) => xScale(getXValue(d)) ?? 0}
                        y={(d) => yScale(getYValue2(d)) ?? 0}
                        stroke="#6CB8F4"
                        strokeWidth={2}
                        curve={curveMonotoneX}

                    />
                    <LinePath
                        data={data}
                        key={Math.random()}
                        x={(d) => xScale(getXValue(d)) ?? 0}
                        y={(d) => yScale(1)}
                        stroke="gray"
                        strokeWidth={1}
                        strokeDasharray="5, 5"
                        curve={curveMonotoneX}

                    />
                    <AxisLeft 
                        left={0} 
                        scale={yScale} 
                        stroke='none'
                        tickStroke="none"
                        tickLabelProps={tickLabelProps}
                        numTicks={5}
                    />
                    <Bar
                        key={Math.random()}
                        width={width}
                        height={height}
                        fill="transparent"
                        x={(d) => xScale(getXValue(d)) ?? 0}
                        y={(d) => yScale(getYValue2(d)) ?? 0}
                        onMouseMove={(event) => {
                            const {x} = localPoint(event) || { x: 0 }
                            const x0 = xScale.invert(x)
                            const index = bisectDate(data,x0,1)
                            const d0 = data[index - 1]
                            const d1 = data[index]
                            let d = d0;
                            if(d1 && getXValue(d1)) {
                                d =
                                x0.valueOf() - getXValue(d0).valueOf() >
                                getXValue(d1).valueOf() - x0.valueOf()
                                    ? d1
                                    : d0;
                            }

                            showTooltip({
                                tooltipData: d,
                                tooltipLeft: x,
                                tooltipTop: yScale(getYValue2(d))
                            });
                        }}
                        onMouseLeave={() => hideTooltip()}
                    />
                </Group>
                
            {tooltipData ? (
            <Group>
                <Line
                from={{ x: tooltipLeft, y: 0 }}
                to={{ x: tooltipLeft, y: height }}
                stroke="#59588D"
                strokeWidth={1}
                pointerEvents="none"
                strokeDasharray="5, 5"
                />
                <circle
                cx={tooltipLeft}
                cy={tooltipTop}
                r={4.5}
                fill="#FFEDB7"
                fillOpacity={0.65}
                pointerEvents="none"
                />
                <circle
                cx={tooltipLeft}
                cy={tooltipTop}
                r={2}
                fill="#9FE37E"
                pointerEvents="none"
                />
            </Group>
            ) : null}
        </svg>
        {tooltipData ? (
        <TooltipWithBounds
          key={Math.random()}
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          {`${timeFormat("%b %d %H:%M ")(new Date(getXValue(tooltipData)))}`}<br/>
          Strategy: <b>{((getYValue2(tooltipData)-1)*100).toFixed(2)}%</b><br/>
          Uderlying: <b>{((getYValue(tooltipData)-1)*100).toFixed(2)}%</b>
        </TooltipWithBounds>
      ) : null}
        </Wrapper>
    );
};

export default PerformanceChart;