export function convertToBalance(value) {
    let int = parseInt(value).toFixed(0)
    let spaces = numberWithSpaces(int)
    return spaces
}

function numberWithSpaces(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

export function secondsToHms(d) {
    d = Number(d)
    let h = Math.floor(d / 3600)
    let m = Math.floor(d % 3600 / 60)
    let s = Math.floor(d % 3600 % 60)
    let hDisplay = h > 0 ? h + (h == 1 ? " hour " : " hours ") : ""
    let mDisplay = m > 0 ? m + (m == 1 ? " minute " : " minutes ") : ""
    let sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : ""
    return hDisplay + mDisplay + sDisplay; 
}