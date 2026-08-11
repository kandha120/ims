import { useParams, Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import baseapi from '../../env/baseapi';
import { barcodeImg1, printer, product69 } from '../../utils/imagepath';

const ProductDetail = () => {
    const { slug } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("ProductDetail mounted. Slug:", slug);
        const fetchProduct = async () => {
            try {
                const response = await fetch(`${baseapi || "http://localhost:8200"}/api/products/${slug}`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setProduct(data);
                }
            } catch (error) {
                console.error("Error fetching product details:", error);
            } finally {
                setLoading(false);
            }
        };
        if (slug) fetchProduct();
    }, [slug]);

    if (loading) return <div className="page-wrapper"><div className="content">Loading...</div></div>;
    if (!product) return <div className="page-wrapper"><div className="content">Product not found.</div></div>;

    return (
        <div>
            <div className="page-wrapper">
                <div className="content">
                    <div className="page-header">
                        <div className="page-title">
                            <h4>Product Details</h4>
                            <h6>Full details of a product</h6>
                        </div>
                    </div>
                    {/* /add */}
                    <div className="row">
                        <div className="col-lg-8 col-sm-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="bar-code-view">
                                        <img src={barcodeImg1} alt="barcode" />
                                        <Link to="#" className="printimg">
                                            <img src={printer} alt="print" />
                                        </Link>
                                    </div>
                                    <div className="productdetails">
                                        <ul className="product-bar">
                                            <li>
                                                <h4>Product</h4>
                                                <h6>{product.productName || "N/A"}</h6>
                                            </li>
                                            <li>
                                                <h4>Category</h4>
                                                <h6>{product.category || "N/A"}</h6>
                                            </li>
                                            <li>
                                                <h4>Sub Category</h4>
                                                <h6>{product.subCategory || "None"}</h6>
                                            </li>
                                            <li>
                                                <h4>Brand</h4>
                                                <h6>{product.brand || "None"}</h6>
                                            </li>
                                            <li>
                                                <h4>Unit</h4>
                                                <h6>{product.units || "N/A"}</h6>
                                            </li>
                                            <li>
                                                <h4>SKU</h4>
                                                <h6>{product.sku || "N/A"}</h6>
                                            </li>

                                            <li>
                                                <h4>Tax</h4>
                                                <h6>{product.taxAmount || "0"}%</h6>
                                            </li>
                                            <li>
                                                <h4>Discount Type</h4>
                                                <h6>{product.discountType || "N/A"}</h6>
                                            </li>
                                            <li>
                                                <h4>Price</h4>
                                                <h6>₹{product.price || "0.00"}</h6>
                                            </li>
                                            <li>
                                                <h4>Status</h4>
                                                <h6>{product.status || "Active"}</h6>
                                            </li>
                                            <li>
                                                <h4>Description</h4>
                                                <h6>{product.description || "No description available."}</h6>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-sm-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="slider-product-details">
                                        <div className="owl-carousel owl-theme product-slide">
                                            <div className="slider-product">
                                                <img src={product69} alt="img" />
                                                <h4>macbookpro.jpg</h4>
                                                <h6>581kb</h6>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* /add */}
                </div>
            </div>


        </div>);

};

export default ProductDetail;
