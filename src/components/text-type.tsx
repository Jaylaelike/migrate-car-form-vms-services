"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

type TextTypeProps = {
    text: string | string[];
    className?: string;
    wrapperClassName?: string;
    cursorClassName?: string;
    cursorChar?: string;
    showCursor?: boolean;
    delay?: number;
    duration?: number; // Duration per character
    loop?: boolean; // Whether for array of texts to loop
    pauseTime?: number; // Pause between texts (after typing)
    deleteSpeed?: number; // Speed of deleting text
};

export default function TextType({
    text,
    className,
    wrapperClassName = "",
    cursorClassName = "",
    cursorChar = "|",
    showCursor = true,
    delay = 0,
    duration = 0.1, // Adjusted default for better readability in loops
    loop = true,
    pauseTime = 2000,
    deleteSpeed = 0.05,
}: TextTypeProps) {
    const [displayedText, setDisplayedText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(duration * 1000);

    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    const textArray = Array.isArray(text) ? text : [text];

    useEffect(() => {
        if (!isInView) return;

        // Initial delay before starting the whole process
        const startTimeout = setTimeout(() => {

            const i = loopNum % textArray.length;
            const fullText = textArray[i];

            const handleTyping = () => {
                setDisplayedText((prev) => {
                    if (isDeleting) {
                        return fullText.substring(0, prev.length - 1);
                    } else {
                        return fullText.substring(0, prev.length + 1);
                    }
                });

                // Determine speed
                let typeSpeed = isDeleting ? deleteSpeed * 1000 : duration * 1000;

                if (!isDeleting && displayedText === fullText) {
                    // Finished typing
                    if (loop || loopNum < textArray.length - 1) {
                        typeSpeed = pauseTime;
                        setIsDeleting(true);
                    } else {
                        // Stop if no loop and last text
                        return;
                    }
                } else if (isDeleting && displayedText === "") {
                    // Finished deleting
                    setIsDeleting(false);
                    setLoopNum(loopNum + 1);
                    typeSpeed = 500; // Small pause before typing next
                }

                setTypingSpeed(typeSpeed);
            };

            const timer = setTimeout(handleTyping, typingSpeed);
            return () => clearTimeout(timer);

        }, loopNum === 0 && !isDeleting && displayedText === "" ? delay * 1000 : 0); // Only apply initial delay once

        return () => clearTimeout(startTimeout);
    }, [displayedText, isDeleting, loopNum, textArray, typingSpeed, isInView, delay, duration, deleteSpeed, pauseTime, loop]);

    return (
        <span className={wrapperClassName} ref={ref}>
            <motion.span
                className={className}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
            >
                {displayedText}
            </motion.span>
            {showCursor && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                    className={cursorClassName}
                >
                    {cursorChar}
                </motion.span>
            )}
        </span>
    );
}
