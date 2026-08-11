import { useState, useEffect } from "react";
import CountUp from "react-countup";
import Chart from "react-apexcharts";
import { Link } from "react-router-dom";
import { all_routes } from "../../routes/all_routes";
import {
  dash1,
  dash2,
  dash3,
  dash4,
  expireProduct01,
  expireProduct02,
  expireProduct03,
  expireProduct04,
  fileTextIcon1,
  stockImg01,
  stockImg02,
  stockImg03,
  stockImg06
} from
  "../../utils/imagepath";
import baseapi from "../../env/baseapi";

const Dashboard = () => {
  const route = all_routes;
  const [chartOptions] = useState({
    series: [
      {
        name: "Sales",
        data: [130, 210, 300, 290, 150, 50, 210, 280, 105]
      },
      {
        name: "Purchase",
        data: [-150, -90, -50, -180, -50, -70, -100, -90, -105]
      }],

    colors: ["#28C76F", "#EA5455"],
    chart: {
      type: "bar",
      height: 320,
      stacked: true,
      zoom: {
        enabled: true
      }
    },
    responsive: [
      {
        breakpoint: 280,
        options: {
          legend: {
            position: "bottom",
            offsetY: 0
          }
        }
      }],

    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        borderRadiusApplication: "end", // "around" / "end"
        borderRadiusWhenStacked: "all", // "all"/"last"
        columnWidth: "20%"
      }
    },
    dataLabels: {
      enabled: false
    },
    yaxis: {
      min: -200,
      max: 400,
      tickAmount: 5
    },
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep"]

    },
    legend: { show: false },
    fill: {
      opacity: 1
    }
  });

  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const res = await fetch(`${baseapi}/api/products/low-stock`, {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          setLowStockProducts(Array.isArray(data) ? data : data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch low stock", err);
      }
    };
    fetchLowStock();
  }, []);

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            {/* ... (Keep existing counters) ... */}
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="card dash-widget w-100">
                <div className="card-body d-flex align-items-center">
                  <div className="dash-widgetimg">
                    <span><img src={dash1} alt="img" /></span>
                  </div>
                  <div className="dash-widgetcontent">
                    <h5> $<span className="counters"><CountUp end={307144} /></span> </h5>
                    <p className="mb-0">Total Purchase Due</p>
                  </div>
                </div>
              </div>
            </div>
            {/* ... (Keep other widgets same for now) ... */}
          </div>

          {/* ... (Keep Graphs) ... */}

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Low Stock Products</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive dataview">
                <table className="table dashboard-expired-products">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.length > 0 ? (
                      lowStockProducts.map((product, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link to={`/product-details/${product.id}`} className="fw-bold">
                                {product.productName || product.product_name}
                              </Link>
                            </div>
                          </td>
                          <td>{product.sku}</td>
                          <td>{product.quantity}</td>
                          <td>₹{product.price}</td>
                          <td><span className="badge bg-danger">Low Stock</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" className="text-center">No Low Stock Products</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;