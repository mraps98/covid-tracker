let typeSelected = "cases";
let areaSelected = "Worldwide";
const populateAreaSelector = () => {
    fetch("https://disease.sh/v3/covid-19/countries")
    .then(res => res.json())
    .then(data =>{
        data.forEach(c =>{
            document.querySelector("#areaSelector select").innerHTML+="<option value='"+c.country+"'>"+c.country+"</option>";
        });
    })
    .catch(error=>console.log(error));
};
//main top info
const updateDataBasedOnSelector = () => {
    let areaSelected = document.querySelector("#areaSelector select").value;
    let endUrl = "";
    if(areaSelected == "Worldwide")
    {
        endUrl="all";
    }
    else{
        endUrl=`countries/${areaSelected}`;
    }
    fetch(`https://disease.sh/v3/covid-19/${endUrl}`)
        .then(res => res.json())
        .then(data=>{
            console.log(data);
            document.querySelector("#tabMenu .cases label.total").innerHTML=`+${data.cases}`;
            document.querySelector("#tabMenu .cases label.today").innerHTML=`+${data.todayCases}`;
            
            document.querySelector("#tabMenu .recovered label.total").innerHTML=`+${data.recovered}`;
            document.querySelector("#tabMenu .recovered label.today").innerHTML=`+${data.todayRecovered}`;
            
            document.querySelector("#tabMenu .deaths label.total").innerHTML=`+${data.deaths}`;
            document.querySelector("#tabMenu .deaths label.today").innerHTML=`+${data.todayDeaths}`;
        })
        .catch(error=>console.log(error));
};

//side tables countries
const getSideTableData = () => {
    fetch("https://disease.sh/v3/covid-19/countries?sort=cases")
    .then(res => res.json())
    .then(data => {
        console.log(data);
        document.querySelector("#sideTable tbody").innerHTML="";
        data.forEach(c=>{
            document.querySelector("#sideTable tbody").innerHTML+="<tr><td>"+c.country+"</td><td>"+c.cases+"</td></tr>";
        });
    })
    .catch(error => console.log(error));
};

//side chart
const updateSideChartData = (update, type="cases") => {
    let url;
    let areaSelected = document.querySelector("#areaSelector select").value;
    if (areaSelected == "Worldwide"){
        url = "https://disease.sh/v3/covid-19/historical/all?lastdays=120";
    }else{
        url = `https://disease.sh/v3/covid-19/historical/${areaSelected}?lastdays=120`
    }
    fetch(url)
    .then(res=>res.json())
    .then(data=>{
        console.log(data);
        makeChart(data, typeSelected, update);
    })
    .catch(error=>console.log(error))
}

let chart;
const makeChart = (data, type=typeSelected, update=false) => {
        let ctx = document.querySelector("#chart").getContext("2d");
        const chartData = [];
        let lastDataPoint;
        let areaSelected = document.querySelector("#areaSelector select").value;
        if(areaSelected == "Worldwide"){
            console.log(data[type]);
            for(let date in data[type]){
                if(lastDataPoint){
                    const newDataPoint = {
                        x: date,
                        y: data[type][date] - lastDataPoint
                    }
                    chartData.push(newDataPoint);
                }
                lastDataPoint = data[type][date];
            }
        }else{
            console.log(data["timeline"][type]);
            for(let date in data["timeline"][type]){
                if(lastDataPoint){
                    const newDataPoint = {
                        x: date,
                        y: data["timeline"][type][date] - lastDataPoint
                    }
                    chartData.push(newDataPoint);
                }
                lastDataPoint = data["timeline"][type][date];
            }
        }
        let options = {
            legend: {
                display: false
            }, 
            elements: {
                point: {
                    radius: 0
                }
            },
            maintainAspectRatio: false,
            tooltips: {
                mode: "index",
            intersect: false,
            callbacks: {
                label: function(tooltipItem, data){
                    return numeral(tooltipItem.value).format("+0,0");
                }
            }
        },
        scales: {
            xAxes:[
                {
                    type: "time",
                    time: {
                        parser: "MM/DD/YY",
                        tooltipFormat: "ll",
                        stepSize: 30
                    }
                }
            ],
            yAxes:[
                {
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        callback: function (value, index, values){
                            return numeral(value).format("0a");
                        }
                    }
                }
            ]
        }
    }

    if(update == false){
        chart = new Chart(ctx, {
            type: "line",
            data : {
                datasets: [
                    {
                        // backgroundColor:"rgba(265, 10, 10, 0.1)",
                        // borderColor: "red",
                        // // data: chartData
                    }
                ]
            },
            options: options
        });
    }
    // chart.data.datasets[0].data = chartData;
    chart.data.datasets[0] = {
        backgroundColor:typeColors[type].background,
        borderColor: typeColors[type].hex,
        data: chartData
    };
    console.log(chartData);
    // console.log(chart.data.datasets[0]);
    chart.update();
}

    
//map
let map;
function initMap(){
    map = new google.maps.Map(document.querySelector("#map"), {
        center: {lat:0, lng:0},
        zoom: 1
    });
    updateMapCircles();
}
const updateMapCenter = () =>{
    let areaSelected = document.querySelector("#areaSelector select").value;
    let url;
    if (areaSelected == "Worldwide"){
        map.setOptions({
            center:{
                lat: 0, lng:0
            },
            zoom: 1
        });
    }else{
        url = `https://disease.sh/v3/covid-19/countries/${areaSelected}`;
        console.log(url);
        
        fetch(url)
        .then(res=>res.json())
        .then(data=>{
            console.log(data);
            map.setOptions({
                center:{
                    lat: data.countryInfo.lat, lng:data.countryInfo.long
                },
                zoom: 5
            });
        })
        .catch(error=>console.log(error));
    }
}
let typeColors = {
    "cases": {
        hex: "red",
        background: "rgba(200, 0, 0, 0.1)",
        multiplier: 800
    },
    "recovered": {
        hex: "green",
        background: "rgba(0, 200, 0, 0.1)",
        multiplier: 1000,
    },
    "deaths": {
        hex: "black",
        background: "rgba(0, 0, 200, 0.1)",
        multiplier: 2000
    }
}
let mapCircles = [];
const updateMapCircles = (type="cases") => {
    mapCircleData = [];
    fetch("https://disease.sh/v3/covid-19/countries")
    .then(res=>res.json())
    .then(data=>{
        console.log("DASD", data);
        data.forEach(c=>{
            const circle = new google.maps.Circle({
                strokeColor: typeColors[type].hex,
                srokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: typeColors[type].hex,
                fillOpacity: 0.35,
                map,
                center: {lat:c.countryInfo.lat, lng:c.countryInfo.long},
                radius: Math.sqrt(c[type]) * typeColors[type].multiplier,
                clickable:true
            })
            mapCircles.push(circle);
            const infoWindow = new google.maps.InfoWindow({
                content: `<h2>${c.country}</h2><label>${c.cases} Cases</label><label>${c.deaths} Deaths</label><label>${c.recovered} Recovered</label>`
            })

            circle.addListener("click", () =>{
                infoWindow.setPosition(circle.getCenter());
                infoWindow.open(map, circle);
            })
        });
    });
}


//event listener for dropdown
document.querySelector("#areaSelector select").addEventListener("change", (e)=>{
    areaSelected=e.target.value;
    updateDataBasedOnSelector();
    updateSideChartData(true);
    document.querySelector("#sideChart .header #areaSelected").innerHTML = e.target.value;
    updateMapCenter();
});


//toggle between cases, recovered, deaths
document.querySelectorAll("#tabMenu > div").forEach(element=>{
    element.addEventListener("click", (e)=>{
        typeSelected=element.classList[0];
        document.querySelectorAll("#tabMenu > div").forEach(t=>{
            t.classList.remove("active");
        })
        element.classList.add("active");
        updateSideChartData(true, element.classList[0]);
        mapCircles.forEach(circle=>{
            circle.setMap(null);
        })
        updateMapCircles(element.classList[0]);
        document.querySelector("#sideChart .header #typeSelected").innerHTML=element.classList[0];
    });
});

//default cases active class
document.querySelector("#tabMenu > div").classList.add("active");
populateAreaSelector();
updateDataBasedOnSelector();
getSideTableData();
updateSideChartData();