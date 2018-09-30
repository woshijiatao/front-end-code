function hasScrolled(el, direction = 'vertical') {
  if(direction === 'vertical') {
    return el.scrollHeight > el.clientHeight
  } else if(direction === 'horizontal') {
    return el.scrollWidth > el.clientWidth
  }
}
