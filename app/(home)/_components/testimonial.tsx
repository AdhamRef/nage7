import Image from "next/image";
import React from "react";

type Props = {
  imageUrl: string;
  opinion: string;
  name: string;
};

const Testimonial = ({ imageUrl, opinion, name }: Props) => {
  return (
    <div className="flex flex-1 flex-col items-center bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
      <img src={imageUrl} alt={name} className="w-28 h-28 rounded-full mb-6 " />

      <p className="text-center text-gray-600 dark:text-gray-200 mb-4">&ldquo;{opinion}&rdquo;</p>
      <p className="text-center text-emerald-600 dark:text-emerald-500 mt-auto font-semibold">- {name}</p>
    </div>
  );
};

export default Testimonial;
