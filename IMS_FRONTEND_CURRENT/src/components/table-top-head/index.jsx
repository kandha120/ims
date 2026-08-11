import { excel, pdf } from "../../utils/imagepath";
import { Link } from "react-router-dom"; // Fixed: was "react-router"
import { Tooltip } from "primereact/tooltip";
import { useSelector, useDispatch } from "react-redux";
import { setToggleHeader } from "../../core/redux/sidebarSlice";

const TableTopHead = ({ onExportPDF, onExportExcel, onRefresh }) => {
  const dispatch = useDispatch();
  const { toggleHeader } = useSelector((state) => state.sidebar);

  const handleToggleHeader = () => {
    dispatch(setToggleHeader(!toggleHeader));
  };

  return (
    <>
      <Tooltip target=".pr-tooltip" />

      {/* ===== COLLAPSIBLE ICONS (PDF, Excel, Refresh) ===== */}
      <ul className="table-top-head flex items-center gap-3">
        <li>
          <Link
            to="#"
            className="pr-tooltip"
            data-pr-tooltip="Pdf"
            data-pr-position="top"
            onClick={(e) => { e.preventDefault(); onExportPDF && onExportPDF(); }}
          >
            <img src={pdf} alt="pdf" className="h-5 w-5" />
          </Link>
        </li>
        <li>
          <Link
            to="#"
            className="pr-tooltip"
            data-pr-tooltip="Excel"
            data-pr-position="top"
            onClick={(e) => { e.preventDefault(); onExportExcel && onExportExcel(); }}
          >
            <img src={excel} alt="excel" className="h-5 w-5" />
          </Link>
        </li>
        <li>
          <Link
            to="#"
            className="pr-tooltip"
            data-pr-tooltip="Refresh"
            data-pr-position="top"
            onClick={(e) => { e.preventDefault(); onRefresh && onRefresh(); }}
          >
            <i className="ti ti-refresh text-lg" />
          </Link>
        </li>
      </ul>

      {/* ===== FLOATING COLLAPSE BUTTON — ALWAYS VISIBLE ===== */}
      {/* <div
        className={`
          fixed top-20 right-6 z-50 
          bg-white border border-gray-300 rounded-full 
          p-2.5 shadow-lg hover:shadow-xl 
          transition-all duration-200 cursor-pointer
          flex items-center justify-center
        `}
        onClick={handleToggleHeader}
        title={toggleHeader ? "Show Header" : "Hide Header"}
      >
        <i
          className={`
            ti text-lg transition-transform duration-200
            ${toggleHeader ? "ti-chevron-down" : "ti-chevron-up"}
          `}
        />
      </div> */}
    </>
  );
};

export default TableTopHead;