import React from "react";
import { Dropdown } from "primereact/dropdown";











const CommonSelect = ({
  value,
  options,
  placeholder = "Select",
  onChange,
  className = "",
  disabled = false,
  filter = true,
  isDisabled,
  ...props
}) => {
  // console.log("values", value);
  const finalDisabled = disabled || isDisabled;
  return (
    <Dropdown
      value={value}
      options={Array.isArray(options) ? options : []}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      disabled={finalDisabled}
      appendTo={document.body}
      filter={filter}
      optionLabel="label"
      optionValue="value"
      {...props} />);


};

export default CommonSelect;