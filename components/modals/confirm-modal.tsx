"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";

interface ConfirmModalProps {
    children: React.ReactNode;
    onConfirm: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ children, onConfirm }) => {


    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-right">
                        هل أنت متأكد ؟
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-right">
                        القرار ده مالوش رجعة
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-x-2">
                    <AlertDialogCancel>رجوع</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>تأكيد</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default ConfirmModal;
