import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Props = {
  value: number;
  label: string;
  isMoney: boolean;
};

const DataCard: React.FC<Props> = ({ value, label, isMoney }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mt-2 text-2xl font-bold">
          {isMoney ? `${value} جنية` : value}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataCard;
