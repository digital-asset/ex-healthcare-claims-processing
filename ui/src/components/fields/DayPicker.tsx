import React from "react";

import ReactDayPicker from "react-day-picker";
import "react-day-picker/lib/style.css";

type Props = {
  date: Date;
  setDate: (date: Date) => void;
  theme: { blue: string };
};

const DayPicker: React.FC<Props> = ({ date, setDate, theme }) => {
  const month = date;

  const modifiers = {
    hover: undefined,
    selected: date,
    today: undefined,
  };

  const styles = {
    hover: {
      border: theme.blue,
    },
    outside: {
      background: "#fafafa",
      cursor: "pointer",
    },
    selected: {
      background: theme.blue,
    },
  };

  const onClick = (date: Date) => {
    setDate(date);
  };

  return (
    <ReactDayPicker
      modifiers={modifiers}
      modifiersStyles={styles}
      month={month}
      onDayClick={onClick}
      showOutsideDays={true}
    />
  );
};

export default DayPicker;
