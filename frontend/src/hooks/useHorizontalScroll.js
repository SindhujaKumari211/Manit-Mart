import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared drag-to-scroll / wheel-to-horizontal / arrow-scroll behavior for
 * horizontal carousels. Touch and trackpad swipe work natively on the
 * `overflow-x-auto` container this hook is bound to.
 */
const useHorizontalScroll = ({ scrollStep = 600 } = {}) => {
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const dragMoved = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows]);

  const scrollByAmount = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(scrollStep, el.clientWidth * 0.9), behavior: "smooth" });
  };

  const handleWheel = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  const handleMouseDown = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = true;
    dragMoved.current = false;
    dragStartX.current = e.pageX - el.offsetLeft;
    dragScrollLeft.current = el.scrollLeft;
  };

  const stopDrag = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = x - dragStartX.current;
    if (Math.abs(walk) > 5) dragMoved.current = true;
    el.scrollLeft = dragScrollLeft.current - walk;
  };

  const handleClickCapture = (e) => {
    if (dragMoved.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const bind = {
    onScroll: updateArrows,
    onWheel: handleWheel,
    onMouseDown: handleMouseDown,
    onMouseLeave: stopDrag,
    onMouseUp: stopDrag,
    onMouseMove: handleMouseMove,
    onClickCapture: handleClickCapture,
  };

  return { scrollRef, canScrollLeft, canScrollRight, scrollByAmount, bind };
};

export default useHorizontalScroll;
