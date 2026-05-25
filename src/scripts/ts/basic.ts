/**
 * 
 */
export class NumUtil {

	/** 四舍五入：  Number(num).toFixed(size); */
	static toFixed(n: number, size: number): number {
		let m = Math.pow(10, size);
		return Math.floor(n * m + 0.50000000001) / m;
	}

	/**
	 * 以可读的形式格式化数字
	 *
	 * @param n: 
	 * @param formatExp: 格式表达式（代码还没有写，默认`##,###.##`的形式）
	 * @returns: 人类可读性的字符串
	 */
	static format(n: number, formatExp?: string): string {
		// let numStr: string = n.toString().replace(/\$|\,/g, '');
		// 解析格式
		let p = 0; // 分隔位符
		let m = 0; // 小数位数
		if (formatExp && formatExp.length > 0) {
			let sArr = formatExp.split(".");
			let s1 = sArr[0]; // 整数格式
			if (s1.length > 0) {
				let pArr = s1.split(",");
				if (pArr.length > 0) {
					for (let pt of pArr) {
						if (pt.length > p) { p = pt.length; }
					}
				}
			}
			let s2 = sArr[1]; // 小数格式
			if (s2.length > 0) {
				for (let ms of s2) {
					if ("#" == ms) { m = m + 1; }
				}
			}
		}
		if (p < 3) { p = 3; }
		if (!formatExp && m < 1) { m = 2; }
		// 开始格式化数字
		let numStr: string = n.toString();
		try {
			let num: number = Math.abs(n);
			let sign = num == n;
			let sArr = this.toFixed(num, m).toString().split(".");
			let s1 = sArr[0] ? sArr[0] : ""; // 整数字符串
			let s2 = sArr[1] ? sArr[1] : ""; // 小数字符串
			if (s2.length < m) {
				for (let i = s2.length; i < m; i++) {
					s2 = s2 + '0';
				}
			}
			// 给整数部分加上分隔符
			let part1 = "";
			for (let i = 0; i < s1.length; i++) {
				part1 = s1[s1.length - 1 - i] + part1;
				if (i > 0 && i < (s1.length - 1) && 0 == ((i + 1) % p)) {
					part1 = "," + part1;
				}
			}
			// 给小数部分加上分隔符
			let part2 = "";
			for (let i = 0; i < s2.length; i++) {
				part2 = part2 + s2[i];
				if (i > 0 && i < (s2.length - 1) && 0 == ((i + 1) % p)) {
					part2 = part2 + ",";
				}
			}
			return (((sign) ? '' : '-') + part1 + '.' + part2);
		} catch (e) {
			console.error(e);
			numStr = "NaN";
		}
		return numStr;
	}

	/**
	 * 
	 * @param s 
	 * @returns 
	 */
	static unformat(s: string): number {
		let ns = s.replace(/[^\d\.-]/g, "");
		return ns.includes(".") ? parseFloat(ns) : parseInt(ns);
	}

	/**
	 * 加法得到金额数据（保留精度问题）
	 * 调用例子：var total = Number(0.09999999).add(0.09999999);
	 * @param n1
	 * @param n2
	 * @returns 
	 */
	static add(n1: number, n2: number): number {
		let r1: number, r2: number;
		try { r1 = n1.toString().split(".")[1].length; } catch (e) { r1 = 0; }
		try { r2 = n2.toString().split(".")[1].length; } catch (e) { r2 = 0; }
		let m = Math.pow(10, Math.max(r1, r2));
		var value = (n1 * m + n2 * m) / m;
		//let mStr = value.toString();
		//var tmpNum = mStr.split(".");
		//if (tmpNum.length > 1) { var l = tmpNum[1]; if (l.length < 2) { mStr = mStr + "0"; } }
		return value;
	}

	/**
	 * 减法得到金额数据（保留精度问题）
	 * 调用例子：var total = Number(-0.09999999).sub(0.00000001);
	 * @param n1
	 * @param n2
	 * @returns
	 */
	static sub(n1: number, n2: number): number {
		let r1: number, r2: number;
		try { r1 = n1.toString().split(".")[1].length; } catch (e) { r1 = 0; }
		try { r2 = n2.toString().split(".")[1].length; } catch (e) { r2 = 0; }
		let m = Math.pow(10, Math.max(r1, r2));
		let value = (n1 * m - n2 * m) / m;
		let mStr = value.toString();
		//var tmpNum = mStr.split(".");
		//if (tmpNum.length > 1) { var l = tmpNum[1]; if (l.length < 2) { mStr = mStr + "0"; } }
		return value;
	}

	/**
	 * 乘法得到金额数据（保留精度问题）
	 * 调用例子：var total = Number(parseInt(num)).mul(parseFloat(dj));
	 * @param n1
	 * @param n2
	 * @returns 
	 */
	static mul(n1: number, n2: number): number {
		let m = 0, s1 = n1.toString(), s2 = n2.toString();
		try { m += s1.split(".")[1].length; } catch (e) { }
		try { m += s2.split(".")[1].length; } catch (e) { }
		let value = Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
		//let mStr = value.toString();
		//var tmpNum = mStr.split(".");
		//if (tmpNum.length > 1) {
		//	var l = tmpNum[1];
		//	if (l.length < 2) { mStr = mStr + "0"; }
		//}
		return value;
	}

	/**
	 * 除法得到金额数据（保留精度问题）
	 * 调用例子：var total = Number(0.000001).div(0.00000001);
	 * @param n1
	 * @param n2
	 * @returns {String}
	 */
	static div(n1: number, n2: number): number {
		let t1 = 0, t2 = 0;
		try { t1 = n1.toString().split(".")[1].length; } catch (e) { }
		try { t2 = n2.toString().split(".")[1].length; } catch (e) { }
		let m = t2 - t1;
		let r1 = Number(n1.toString().replace(".", ""));
		let r2 = Number(n2.toString().replace(".", ""));
		let value = (r1 / r2) * Math.pow(10, m + 1);
		return value / 10;
	}

	/**
	 * 曲线函数，x在0到1之间，Y向上凸出的曲线。
	 * @param x 
	 * @returns 
	 */
	static baseCurve(x: number): number {
		return (x < 0) || (x > 1) ? 0 : Math.sin(x * Math.PI);
	}

	static createCurve(totalXDis: number, topX: number, minY: number, maxY: number): (x: number) => number {
		let curve = (x: number): number => {
			const beginX = topX - totalXDis / 2;
			const endX = topX + totalXDis / 2;
			if (x < beginX || x > endX) {
				return minY;
			} else {
				const yDis = maxY - minY;
				return this.baseCurve((x - beginX) / totalXDis) * yDis + minY;
			}
		}
		return curve;
	}

}


/**
 * 
 */
export class StrUtil {

	static trim(s: string): string {
		return s.replace(/(^\s*)|(\s*$)/g, "");
	}

	static trimLeft(s: string): string {
		return s.replace(/(^\s*)/g, "");
	}

	static trimRight(s: string): string {
		return s.replace(/(\s*$)/g, "");
	}

	static leftPad(str: string, max: number, place?: string): string {
		place = place ? place : " ";
		while (str.length < max) {
			str = place + str;
		}
		return str;
	}

	static rightPad(str: string, max: number, place?: string): string {
		place = place ? place : " ";
		while (str.length < max) {
			str = str + place;
		}
		return str;
	}


	/**
	 * 字符串格式化工具，用名称来替换
	 * 例： "我是{name}，今年{age}了".format({name:"loogn",age:22});
	 */
	static format(s: string, args: string): string {
		let result = s;
		if (arguments.length < 1) {
			return result;
		}
		let data = arguments; // 如果模板参数是数组
		// 如果模板参数是对象
		if (arguments.length == 1 && typeof (args) == "object") {
			data = args;
		}
		for (var key in data) {
			var value = data[key];
			if (undefined !== value) { result = result.replace("\\{" + key + "\\}", value); }
		}
		return result;
	}


	/**
	 * 替换所有匹配exp的字符串为指定字符串
	 * @param exp 被替换部分的正则
	 * @param newStr 替换成的字符串
	 */
	static replaceAll(s: String, exp: string, newStr: string): string {
		return s.replace(new RegExp(exp, "gm"), newStr);
	}


	// 	/**
	// 	 * 
	// 	 * @param num 
	// 	 * @param scale 
	// 	 * @returns 
	// 	 */
	// 	static formatNumber(num: number, scale: number) {
	// 		scale = scale > 0 && scale <= 20 ? scale : 2;
	// 		let numStr = num.toFixed(scale) + "";
	// 		let l = numStr.split(".")[0].split("").reverse(), r = numStr.split(".")[1];
	// 		let t = "";
	// 		for (var i = 0; i < l.length; i++) {
	// 			t += l[i] + ((i + 1) % 3 === 0 && (i + 1) != l.length ? "," : "");
	// 		}
	// 		return t.split("").reverse().join("") + "." + r;
	// 	}

	/**
	 * 
	 * @param str 
	 * @returns 
	 */
	static utf16to8(str: string): string {
		let out = "";
		let len = str.length;
		for (let i = 0; i < len; i++) {
			let c = str.charCodeAt(i);
			if ((c >= 0x0001) && (c <= 0x007F)) {
				out += str.charAt(i);
			} else if (c > 0x07FF) {
				out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
				out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
				out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
			} else {
				out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
				out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
			}
		}
		return out;
	}

	/**
	 * 
	 * @param str 
	 * @returns 
	 */
	static utf8to16(str: string): string {
		let out = "";
		let len = str.length;
		let i = 0;
		let char2: number, char3: number;
		while (i < len) {
			let c = str.charCodeAt(i++);
			switch (c >> 4) {
				case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
					// 0xxxxxxx
					out += str.charAt(i - 1);
					break;
				case 12: case 13:
					// 110x xxxx   10xx xxxx
					char2 = str.charCodeAt(i++);
					out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
					break;
				case 14:
					// 1110 xxxx  10xx xxxx  10xx xxxx
					char2 = str.charCodeAt(i++);
					char3 = str.charCodeAt(i++);
					out += String.fromCharCode(((c & 0x0F) << 12) |
						((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0));
					break;
			}
		}
		return out;
	}

	/**
	 * 
	 * @param str 
	 * @returns 
	 */
	static base64encode(str: string): string {
		let base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
			"abcdefghijklmnopqrstuvwxyz0123456789+/";
		let len = str.length;
		let out = "";
		let c1, c2, c3;
		let i = 0;
		while (i < len) {
			c1 = str.charCodeAt(i++) & 0xff;
			if (i == len) {
				out += base64EncodeChars.charAt(c1 >> 2);
				out += base64EncodeChars.charAt((c1 & 0x3) << 4);
				out += "==";
				break;
			}
			c2 = str.charCodeAt(i++);
			if (i == len) {
				out += base64EncodeChars.charAt(c1 >> 2);
				out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
				out += base64EncodeChars.charAt((c2 & 0xF) << 2);
				out += "=";
				break;
			}
			c3 = str.charCodeAt(i++);
			out += base64EncodeChars.charAt(c1 >> 2);
			out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
			out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
			out += base64EncodeChars.charAt(c3 & 0x3F);
		}
		return out;
	}

	/**
	 * 
	 * @param str 
	 * @returns 
	 */
	static base64decode(str: string): string {
		let base64DecodeChars = new Array(
			-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
			-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
			-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
			52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
			-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
			15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
			-1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
			41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);
		let len = str.length;
		let out = "";
		let i = 0, c1, c2, c3, c4;
		while (i < len) {
			/* c1 */
			do {
				c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
			} while (i < len && c1 == -1);
			if (c1 == -1) break;
			/* c2 */
			do {
				c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
			} while (i < len && c2 == -1);
			if (c2 == -1) break;
			out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));
			/* c3 */
			do {
				c3 = str.charCodeAt(i++) & 0xff;
				if (c3 == 61)
					return out;
				c3 = base64DecodeChars[c3];
			} while (i < len && c3 == -1);
			if (c3 == -1) break;
			out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));
			/* c4 */
			do {
				c4 = str.charCodeAt(i++) & 0xff;
				if (c4 == 61)
					return out;
				c4 = base64DecodeChars[c4];
			} while (i < len && c4 == -1);
			if (c4 == -1) break;
			out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
		}
		return out;
	}

}


/**
 * 
 */
export class TimeUtil {

	static readonly UNIT_SEC: number = 1000;
	static readonly UNIT_MIN: number = 1000 * 60;
	static readonly UNIT_HUR: number = 1000 * 60 * 60;
	static readonly UNIT_DAY: number = 1000 * 60 * 60 * 24;

	static async sleep(milSecs: number): Promise<any> {
		return new Promise((resolve: (parm: any) => void) => {setTimeout(() => { resolve(null);/* do nothing */}, milSecs);})
	}

	/**
	 * JS时间Date格式化参数
	 *
	 * @param d: date
	 * @param result : 格式化字符串如：'yyyy-MM-dd HH:mm:ss'
	 *
	 * @returns 
	 */
	static format(d: Date, f?: string): string {
		let result = f ? f : "yyyy-MM-dd HH:mm:ss.SSS";
		let processPart = (part: string, num: number) => {
			if (new RegExp(`(${part})`).test(result)) {
				let mark = RegExp.$1;
				let text = `${num}`;
				result = result.replace(mark, StrUtil.leftPad(text, mark.length, '0'));
			}
		}
		processPart("y+", d.getFullYear());
		processPart("M+", d.getMonth() + 1);
		processPart("d+", d.getDate());
		processPart("H+", d.getHours());
		processPart("m+", d.getMinutes());
		processPart("s+", d.getSeconds());
		processPart("q+", Math.floor((d.getMonth() + 3) / 3));
		processPart("S+", d.getMilliseconds());
		return result;
	}


	/**
	 * 添加毫秒数
	 * 
	 * @param d: date
	 * @param ms: 加上的毫秒数
	 * @returns 
	 */
	static addMilliseconds(d: Date, ms: number): Date {
		let date = new Date(d);
		date.setTime(date.getTime() + ms);
		return date;
	}


	/**
	 * 添加秒数
	 *
	 * @param d: date
	 * @param secs: 加上的秒数
	 *
	 * @returns {Date}
	 */
	static addSeconds(d: Date, secs: number): Date {
		var date = new Date(d);
		date.setSeconds(date.getSeconds() + secs);
		return date;
	}


	/**
	 * 添加天数
	 *
	 * @param d: date
	 * @param days: 加上的天数，比如40天
	 *
	 * @returns  加上天数以后的日期
	 */
	static addDays(d: Date, days: number): Date {
		var date = new Date(d);
		date.setDate(date.getDate() + days);
		return date;
	}

	/**
	 * 添加月数
	 *
	 * @param d: date
	 * @param months: 加上的月数
	 *
	 * @returns 
	 */
	static addMonths(d: Date, months: number): Date {
		var date = new Date(d);
		date.setMonth(date.getMonth() + months);
		return date;
	}


	/**
	 * 添加年数
	 *
	 * @param d: date
	 * @param years: 加上的年数
	 *
	 * @returns 
	 */
	static addYears(d: Date, years: number): Date {
		var date = new Date(d);
		date.setFullYear(date.getFullYear() + years);
		return date;
	}

	/**
	 * 初始化为一天的`00:00:00`
	 * @param date 
	 * @returns 
	 */
	static cleanDay(date: Date): Date {
		var newDate = new Date();
		newDate.setTime(date.getTime());
		newDate.setHours(0, 0, 0, 0);
		return newDate;
	}

	/**
	 * 取得两天之间的时间范围
	 * 
	 * @param date 
	 * @param days 
	 * @returns 
	 */
	static getTimeArea(date: Date, days: number): { floor: Date, ceil: Date } {
		var d1 = TimeUtil.cleanDay(date);
		var d2 = TimeUtil.cleanDay(TimeUtil.addDays(d1, days));
		if (d1 < d2) {
			return { floor: d1, ceil: d2 };
		} else {
			return { floor: d2, ceil: d1 };
		}
	}

	/**
	 * 取得两天之间的时间范围
	 * 
	 * @param date 
	 * @param days 
	 * @returns 
	 */
	static getDateArea(date: Date, ms: number): { floor: Date, ceil: Date } {
		var d1 = date;
		var d2 = TimeUtil.cleanDay(TimeUtil.addMilliseconds(d1, ms));
		if (d1 < d2) {
			return { floor: d1, ceil: d2 };
		} else {
			return { floor: d2, ceil: d1 };
		}
	}

	/**
	 * 取得所在的时区
	 * 
	 * @returns 
	 */
	static getLocalTimeZone(): string {
		var d = new Date();
		return (`GMT${d.getTimezoneOffset() / 60}`);
	}

	/**
	 * 取得所在的时区名
	 * @returns 
	 */
	static getLocalTimeZoneName(): string {
		var tmSummer = new Date(Date.UTC(2005, 6, 30, 0, 0, 0, 0));
		var so = -1 * tmSummer.getTimezoneOffset();
		var tmWinter = new Date(Date.UTC(2005, 12, 30, 0, 0, 0, 0));
		var wo = -1 * tmWinter.getTimezoneOffset();
		if (-660 == so && -660 == wo) return 'Pacific/Midway';
		if (-600 == so && -600 == wo) return 'Pacific/Tahiti';
		if (-570 == so && -570 == wo) return 'Pacific/Marquesas';
		if (-540 == so && -600 == wo) return 'America/Adak';
		if (-540 == so && -540 == wo) return 'Pacific/Gambier';
		if (-480 == so && -540 == wo) return 'US/Alaska';
		if (-480 == so && -480 == wo) return 'Pacific/Pitcairn';
		if (-420 == so && -480 == wo) return 'US/Pacific';
		if (-420 == so && -420 == wo) return 'US/Arizona';
		if (-360 == so && -420 == wo) return 'US/Mountain';
		if (-360 == so && -360 == wo) return 'America/Guatemala';
		if (-360 == so && -300 == wo) return 'Pacific/Easter';
		if (-300 == so && -360 == wo) return 'US/Central';
		if (-300 == so && -300 == wo) return 'America/Bogota';
		if (-240 == so && -300 == wo) return 'US/Eastern';
		if (-240 == so && -240 == wo) return 'America/Caracas';
		if (-240 == so && -180 == wo) return 'America/Santiago';
		if (-180 == so && -240 == wo) return 'Canada/Atlantic';
		if (-180 == so && -180 == wo) return 'America/Montevideo';
		if (-180 == so && -120 == wo) return 'America/Sao_Paulo';
		if (-150 == so && -210 == wo) return 'America/St_Johns';
		if (-120 == so && -180 == wo) return 'America/Godthab';
		if (-120 == so && -120 == wo) return 'America/Noronha';
		if ( -60 == so &&  -60 == wo) return 'Atlantic/Cape_Verde';
		if (   0 == so &&  -60 == wo) return 'Atlantic/Azores';
		if (   0 == so &&    0 == wo) return 'Africa/Casablanca';
		if (  60 == so &&    0 == wo) return 'Europe/London';
		if (  60 == so &&   60 == wo) return 'Africa/Algiers';
		if (  60 == so &&  120 == wo) return 'Africa/Windhoek';
		if ( 120 == so &&   60 == wo) return 'Europe/Amsterdam';
		if ( 120 == so &&  120 == wo) return 'Africa/Harare';
		if ( 180 == so &&  120 == wo) return 'Europe/Athens';
		if ( 180 == so &&  180 == wo) return 'Africa/Nairobi';
		if ( 240 == so &&  180 == wo) return 'Europe/Moscow';
		if ( 240 == so &&  240 == wo) return 'Asia/Dubai';
		if ( 270 == so &&  210 == wo) return 'Asia/Tehran';
		if ( 270 == so &&  270 == wo) return 'Asia/Kabul';
		if ( 300 == so &&  240 == wo) return 'Asia/Baku';
		if ( 300 == so &&  300 == wo) return 'Asia/Karachi';
		if ( 330 == so &&  330 == wo) return 'Asia/Calcutta';
		if ( 345 == so &&  345 == wo) return 'Asia/Katmandu';
		if ( 360 == so &&  300 == wo) return 'Asia/Yekaterinburg';
		if ( 360 == so &&  360 == wo) return 'Asia/Colombo';
		if ( 390 == so &&  390 == wo) return 'Asia/Rangoon';
		if ( 420 == so &&  360 == wo) return 'Asia/Almaty';
		if ( 420 == so &&  420 == wo) return 'Asia/Bangkok';
		if ( 480 == so &&  420 == wo) return 'Asia/Krasnoyarsk';
		if ( 480 == so &&  480 == wo) return 'Australia/Perth';
		if ( 540 == so &&  480 == wo) return 'Asia/Irkutsk';
		if ( 540 == so &&  540 == wo) return 'Asia/Tokyo';
		if ( 570 == so &&  570 == wo) return 'Australia/Darwin';
		if ( 570 == so &&  630 == wo) return 'Australia/Adelaide';
		if ( 600 == so &&  540 == wo) return 'Asia/Yakutsk';
		if ( 600 == so &&  600 == wo) return 'Australia/Brisbane';
		if ( 600 == so &&  660 == wo) return 'Australia/Sydney';
		if ( 630 == so &&  660 == wo) return 'Australia/Lord_Howe';
		if ( 660 == so &&  600 == wo) return 'Asia/Vladivostok';
		if ( 660 == so &&  660 == wo) return 'Pacific/Guadalcanal';
		if ( 690 == so &&  690 == wo) return 'Pacific/Norfolk';
		if ( 720 == so &&  660 == wo) return 'Asia/Magadan';
		if ( 720 == so &&  720 == wo) return 'Pacific/Fiji';
		if ( 720 == so &&  780 == wo) return 'Pacific/Auckland';
		if ( 765 == so &&  825 == wo) return 'Pacific/Chatham';
		if ( 780 == so &&  780 == wo) return 'Pacific/Enderbury';
		if ( 840 == so &&  840 == wo) return 'Pacific/Kiritimati';
		return 'Not in US';
	}

	/**
	 * 取得时间的可读文本
	 * @param date 
	 * @returns 
	 */
	static getLocalTimeStr(date: Date): string {
		return this.format(date, "yyyy-MM-dd HH:mm:ss.SSS");
	}


}

export interface IColorRGB { readonly r: number, readonly g: number, readonly b: number };
export class ColorRGB implements IColorRGB {
	readonly r: number;
	readonly g: number;
	readonly b: number;
	readonly rgbStr: string;
	readonly hexStr: string;
	private color140: null | { color: ColorRGB, name: string } = null;

	constructor(r: number, g: number, b: number) {
		this.r = r;
		this.g = g;
		this.b = b;
		//
		this.rgbStr = `rgb(${this.r},${this.g},${this.b})`;
		//
		let rs = this.r.toString(16);
		let gs = this.g.toString(16);
		let bs = this.b.toString(16);
		rs = rs.length > 1 ? rs : "0" + rs;
		gs = gs.length > 1 ? gs : "0" + gs;
		bs = bs.length > 1 ? bs : "0" + bs;
		this.hexStr = `#${rs}${gs}${bs}`;
	}

	static fromStrHex(str: string): ColorRGB {
		let r = 0, g = 0, b = 0;
		if (!str) {
			// do nothing
		} else if (str.length > 6) {
			r = parseInt(`0x${str.substring(1, 3)}`);
			g = parseInt(`0x${str.substring(3, 5)}`);
			b = parseInt(`0x${str.substring(5, 7)}`);
		}
		return new ColorRGB(r, g, b);
	}

	static fromNameTo140(name: string): { color: ColorRGB, name: string } {
		let result = color140.White;
		for (let i = 0; i < color140Arr.length; i++) {
			let color = color140Arr[i];
			if (name == color.name) {
				result = color140Arr[i].color;
			}
		}
		return result;
	}

	static fromRgbTo140(r: number, g: number, b: number): { color: ColorRGB, name: string } {
		let minIdx = 0;
		let minDiff = 255 + 255 + 255;

		let idx = 0;
		while (idx < color140Arr.length) {
			let rec = color140Arr[idx].color;
			let curr = rec.color;
			let diff = Math.abs(curr.r - r) + Math.abs(curr.g - g) + Math.abs(curr.b - b);
			if (diff < minDiff) {
				minIdx = idx;
				minDiff = diff;
			}
			idx++;
		}
		return color140Arr[minIdx].color;
	}

	static fromHexTo140(str: string): { color: ColorRGB, name: string } {
		let r = 0, g = 0, b = 0;
		if (!str) {
			// do nothing
		} else if (str.length > 6) {
			r = parseInt(`0x${str.substring(1, 3)}`);
			g = parseInt(`0x${str.substring(3, 5)}`);
			b = parseInt(`0x${str.substring(5, 7)}`);
		}
		return ColorRGB.fromRgbTo140(r, g, b);
	}


	toStrRGB(): string { return this.rgbStr; }

	toStrHex(): string { return this.hexStr; }

	to140Color(): { color: ColorRGB, name: string } {
		if (null != this.color140) {
			return this.color140;
		} else {
			this.color140 = ColorRGB.fromRgbTo140(this.r, this.g, this.b);
			return this.color140;
		}
	}

	oppColor(): { color: ColorRGB, name: string } {
		// 互补色的查询
		// https://htmlcolorcodes.com/zh/yanse-xuanze-qi/
		// https://zh.planetcalc.com/7661/
		let color140 = this.to140Color();
		let result = color140Arr[0];
		for (let i = 0; i < color140Arr.length; i++) {
			let rec = color140Arr[i];
			if (color140.name == rec.name) {
				result = rec;
			}
		}
		return result.rev;
	}

};



let color140 = {
	Black                : {color: ColorRGB.fromStrHex('#000000'), name: "Black"               },
	Navy                 : {color: ColorRGB.fromStrHex('#000080'), name: "Navy"                },
	DarkBlue             : {color: ColorRGB.fromStrHex('#00008B'), name: "DarkBlue"            },
	MediumBlue           : {color: ColorRGB.fromStrHex('#0000CD'), name: "MediumBlue"          },
	Blue                 : {color: ColorRGB.fromStrHex('#0000FF'), name: "Blue"                },
	DarkGreen            : {color: ColorRGB.fromStrHex('#006400'), name: "DarkGreen"           },
	Green                : {color: ColorRGB.fromStrHex('#008000'), name: "Green"               },
	Teal                 : {color: ColorRGB.fromStrHex('#008080'), name: "Teal"                },
	DarkCyan             : {color: ColorRGB.fromStrHex('#008B8B'), name: "DarkCyan"            },
	DeepSkyBlue          : {color: ColorRGB.fromStrHex('#00BFFF'), name: "DeepSkyBlue"         },
	DarkTurquoise        : {color: ColorRGB.fromStrHex('#00CED1'), name: "DarkTurquoise"       },
	MediumSpringGreen    : {color: ColorRGB.fromStrHex('#00FA9A'), name: "MediumSpringGreen"   },
	Lime                 : {color: ColorRGB.fromStrHex('#00FF00'), name: "Lime"                },
	SpringGreen          : {color: ColorRGB.fromStrHex('#00FF7F'), name: "SpringGreen"         },
	Aqua                 : {color: ColorRGB.fromStrHex('#00FFFF'), name: "Aqua"                },
	Cyan                 : {color: ColorRGB.fromStrHex('#00FFFF'), name: "Cyan"                },
	MidnightBlue         : {color: ColorRGB.fromStrHex('#191970'), name: "MidnightBlue"        },
	DodgerBlue           : {color: ColorRGB.fromStrHex('#1E90FF'), name: "DodgerBlue"          },
	LightSeaGreen        : {color: ColorRGB.fromStrHex('#20B2AA'), name: "LightSeaGreen"       },
	ForestGreen          : {color: ColorRGB.fromStrHex('#228B22'), name: "ForestGreen"         },
	SeaGreen             : {color: ColorRGB.fromStrHex('#2E8B57'), name: "SeaGreen"            },
	DarkSlateGray        : {color: ColorRGB.fromStrHex('#2F4F4F'), name: "DarkSlateGray"       },
	LimeGreen            : {color: ColorRGB.fromStrHex('#32CD32'), name: "LimeGreen"           },
	MediumSeaGreen       : {color: ColorRGB.fromStrHex('#3CB371'), name: "MediumSeaGreen"      },
	Turquoise            : {color: ColorRGB.fromStrHex('#40E0D0'), name: "Turquoise"           },
	RoyalBlue            : {color: ColorRGB.fromStrHex('#4169E1'), name: "RoyalBlue"           },
	SteelBlue            : {color: ColorRGB.fromStrHex('#4682B4'), name: "SteelBlue"           },
	DarkSlateBlue        : {color: ColorRGB.fromStrHex('#483D8B'), name: "DarkSlateBlue"       },
	MediumTurquoise      : {color: ColorRGB.fromStrHex('#48D1CC'), name: "MediumTurquoise"     },
	Indigo               : {color: ColorRGB.fromStrHex('#4B0082'), name: "Indigo"              },
	DarkOliveGreen       : {color: ColorRGB.fromStrHex('#556B2F'), name: "DarkOliveGreen"      },
	CadetBlue            : {color: ColorRGB.fromStrHex('#5F9EA0'), name: "CadetBlue"           },
	CornflowerBlue       : {color: ColorRGB.fromStrHex('#6495ED'), name: "CornflowerBlue"      },
	MediumAquaMarine     : {color: ColorRGB.fromStrHex('#66CDAA'), name: "MediumAquaMarine"    },
	DimGray              : {color: ColorRGB.fromStrHex('#696969'), name: "DimGray"             },
	SlateBlue            : {color: ColorRGB.fromStrHex('#6A5ACD'), name: "SlateBlue"           },
	OliveDrab            : {color: ColorRGB.fromStrHex('#6B8E23'), name: "OliveDrab"           },
	SlateGray            : {color: ColorRGB.fromStrHex('#708090'), name: "SlateGray"           },
	LightSlateGray       : {color: ColorRGB.fromStrHex('#778899'), name: "LightSlateGray"      },
	MediumSlateBlue      : {color: ColorRGB.fromStrHex('#7B68EE'), name: "MediumSlateBlue"     },
	LawnGreen            : {color: ColorRGB.fromStrHex('#7CFC00'), name: "LawnGreen"           },
	Chartreuse           : {color: ColorRGB.fromStrHex('#7FFF00'), name: "Chartreuse"          },
	Aquamarine           : {color: ColorRGB.fromStrHex('#7FFFD4'), name: "Aquamarine"          },
	Maroon               : {color: ColorRGB.fromStrHex('#800000'), name: "Maroon"              },
	Purple               : {color: ColorRGB.fromStrHex('#800080'), name: "Purple"              },
	Olive                : {color: ColorRGB.fromStrHex('#808000'), name: "Olive"               },
	Gray                 : {color: ColorRGB.fromStrHex('#808080'), name: "Gray"                },
	SkyBlue              : {color: ColorRGB.fromStrHex('#87CEEB'), name: "SkyBlue"             },
	LightSkyBlue         : {color: ColorRGB.fromStrHex('#87CEFA'), name: "LightSkyBlue"        },
	BlueViolet           : {color: ColorRGB.fromStrHex('#8A2BE2'), name: "BlueViolet"          },
	DarkRed              : {color: ColorRGB.fromStrHex('#8B0000'), name: "DarkRed"             },
	DarkMagenta          : {color: ColorRGB.fromStrHex('#8B008B'), name: "DarkMagenta"         },
	SaddleBrown          : {color: ColorRGB.fromStrHex('#8B4513'), name: "SaddleBrown"         },
	DarkSeaGreen         : {color: ColorRGB.fromStrHex('#8FBC8F'), name: "DarkSeaGreen"        },
	LightGreen           : {color: ColorRGB.fromStrHex('#90EE90'), name: "LightGreen"          },
	MediumPurple         : {color: ColorRGB.fromStrHex('#9370DB'), name: "MediumPurple"        },
	DarkViolet           : {color: ColorRGB.fromStrHex('#9400D3'), name: "DarkViolet"          },
	PaleGreen            : {color: ColorRGB.fromStrHex('#98FB98'), name: "PaleGreen"           },
	DarkOrchid           : {color: ColorRGB.fromStrHex('#9932CC'), name: "DarkOrchid"          },
	YellowGreen          : {color: ColorRGB.fromStrHex('#9ACD32'), name: "YellowGreen"         },
	Sienna               : {color: ColorRGB.fromStrHex('#A0522D'), name: "Sienna"              },
	Brown                : {color: ColorRGB.fromStrHex('#A52A2A'), name: "Brown"               },
	DarkGray             : {color: ColorRGB.fromStrHex('#A9A9A9'), name: "DarkGray"            },
	LightBlue            : {color: ColorRGB.fromStrHex('#ADD8E6'), name: "LightBlue"           },
	GreenYellow          : {color: ColorRGB.fromStrHex('#ADFF2F'), name: "GreenYellow"         },
	PaleTurquoise        : {color: ColorRGB.fromStrHex('#AFEEEE'), name: "PaleTurquoise"       },
	LightSteelBlue       : {color: ColorRGB.fromStrHex('#B0C4DE'), name: "LightSteelBlue"      },
	PowderBlue           : {color: ColorRGB.fromStrHex('#B0E0E6'), name: "PowderBlue"          },
	FireBrick            : {color: ColorRGB.fromStrHex('#B22222'), name: "FireBrick"           },
	DarkGoldenRod        : {color: ColorRGB.fromStrHex('#B8860B'), name: "DarkGoldenRod"       },
	MediumOrchid         : {color: ColorRGB.fromStrHex('#BA55D3'), name: "MediumOrchid"        },
	RosyBrown            : {color: ColorRGB.fromStrHex('#BC8F8F'), name: "RosyBrown"           },
	DarkKhaki            : {color: ColorRGB.fromStrHex('#BDB76B'), name: "DarkKhaki"           },
	Silver               : {color: ColorRGB.fromStrHex('#C0C0C0'), name: "Silver"              },
	MediumVioletRed      : {color: ColorRGB.fromStrHex('#C71585'), name: "MediumVioletRed"     },
	IndianRed            : {color: ColorRGB.fromStrHex('#CD5C5C'), name: "IndianRed"           },
	Peru                 : {color: ColorRGB.fromStrHex('#CD853F'), name: "Peru"                },
	Chocolate            : {color: ColorRGB.fromStrHex('#D2691E'), name: "Chocolate"           },
	Tan                  : {color: ColorRGB.fromStrHex('#D2B48C'), name: "Tan"                 },
	LightGray            : {color: ColorRGB.fromStrHex('#D3D3D3'), name: "LightGray"           },
	Thistle              : {color: ColorRGB.fromStrHex('#D8BFD8'), name: "Thistle"             },
	Orchid               : {color: ColorRGB.fromStrHex('#DA70D6'), name: "Orchid"              },
	GoldenRod            : {color: ColorRGB.fromStrHex('#DAA520'), name: "GoldenRod"           },
	PaleVioletRed        : {color: ColorRGB.fromStrHex('#DB7093'), name: "PaleVioletRed"       },
	Crimson              : {color: ColorRGB.fromStrHex('#DC143C'), name: "Crimson"             },
	Gainsboro            : {color: ColorRGB.fromStrHex('#DCDCDC'), name: "Gainsboro"           },
	Plum                 : {color: ColorRGB.fromStrHex('#DDA0DD'), name: "Plum"                },
	BurlyWood            : {color: ColorRGB.fromStrHex('#DEB887'), name: "BurlyWood"           },
	LightCyan            : {color: ColorRGB.fromStrHex('#E0FFFF'), name: "LightCyan"           },
	Lavender             : {color: ColorRGB.fromStrHex('#E6E6FA'), name: "Lavender"            },
	DarkSalmon           : {color: ColorRGB.fromStrHex('#E9967A'), name: "DarkSalmon"          },
	Violet               : {color: ColorRGB.fromStrHex('#EE82EE'), name: "Violet"              },
	PaleGoldenRod        : {color: ColorRGB.fromStrHex('#EEE8AA'), name: "PaleGoldenRod"       },
	LightCoral           : {color: ColorRGB.fromStrHex('#F08080'), name: "LightCoral"          },
	Khaki                : {color: ColorRGB.fromStrHex('#F0E68C'), name: "Khaki"               },
	AliceBlue            : {color: ColorRGB.fromStrHex('#F0F8FF'), name: "AliceBlue"           },
	HoneyDew             : {color: ColorRGB.fromStrHex('#F0FFF0'), name: "HoneyDew"            },
	Azure                : {color: ColorRGB.fromStrHex('#F0FFFF'), name: "Azure"               },
	SandyBrown           : {color: ColorRGB.fromStrHex('#F4A460'), name: "SandyBrown"          },
	Wheat                : {color: ColorRGB.fromStrHex('#F5DEB3'), name: "Wheat"               },
	Beige                : {color: ColorRGB.fromStrHex('#F5F5DC'), name: "Beige"               },
	WhiteSmoke           : {color: ColorRGB.fromStrHex('#F5F5F5'), name: "WhiteSmoke"          },
	MintCream            : {color: ColorRGB.fromStrHex('#F5FFFA'), name: "MintCream"           },
	GhostWhite           : {color: ColorRGB.fromStrHex('#F8F8FF'), name: "GhostWhite"          },
	Salmon               : {color: ColorRGB.fromStrHex('#FA8072'), name: "Salmon"              },
	AntiqueWhite         : {color: ColorRGB.fromStrHex('#FAEBD7'), name: "AntiqueWhite"        },
	Linen                : {color: ColorRGB.fromStrHex('#FAF0E6'), name: "Linen"               },
	LightGoldenRodYellow : {color: ColorRGB.fromStrHex('#FAFAD2'), name: "LightGoldenRodYellow"},
	OldLace              : {color: ColorRGB.fromStrHex('#FDF5E6'), name: "OldLace"             },
	Red                  : {color: ColorRGB.fromStrHex('#FF0000'), name: "Red"                 },
	Fuchsia              : {color: ColorRGB.fromStrHex('#FF00FF'), name: "Fuchsia"             },
	Magenta              : {color: ColorRGB.fromStrHex('#FF00FF'), name: "Magenta"             },
	DeepPink             : {color: ColorRGB.fromStrHex('#FF1493'), name: "DeepPink"            },
	OrangeRed            : {color: ColorRGB.fromStrHex('#FF4500'), name: "OrangeRed"           },
	Tomato               : {color: ColorRGB.fromStrHex('#FF6347'), name: "Tomato"              },
	HotPink              : {color: ColorRGB.fromStrHex('#FF69B4'), name: "HotPink"             },
	Coral                : {color: ColorRGB.fromStrHex('#FF7F50'), name: "Coral"               },
	DarkOrange           : {color: ColorRGB.fromStrHex('#FF8C00'), name: "DarkOrange"          },
	LightSalmon          : {color: ColorRGB.fromStrHex('#FFA07A'), name: "LightSalmon"         },
	Orange               : {color: ColorRGB.fromStrHex('#FFA500'), name: "Orange"              },
	LightPink            : {color: ColorRGB.fromStrHex('#FFB6C1'), name: "LightPink"           },
	Pink                 : {color: ColorRGB.fromStrHex('#FFC0CB'), name: "Pink"                },
	Gold                 : {color: ColorRGB.fromStrHex('#FFD700'), name: "Gold"                },
	PeachPuff            : {color: ColorRGB.fromStrHex('#FFDAB9'), name: "PeachPuff"           },
	NavajoWhite          : {color: ColorRGB.fromStrHex('#FFDEAD'), name: "NavajoWhite"         },
	Moccasin             : {color: ColorRGB.fromStrHex('#FFE4B5'), name: "Moccasin"            },
	Bisque               : {color: ColorRGB.fromStrHex('#FFE4C4'), name: "Bisque"              },
	MistyRose            : {color: ColorRGB.fromStrHex('#FFE4E1'), name: "MistyRose"           },
	BlanchedAlmond       : {color: ColorRGB.fromStrHex('#FFEBCD'), name: "BlanchedAlmond"      },
	PapayaWhip           : {color: ColorRGB.fromStrHex('#FFEFD5'), name: "PapayaWhip"          },
	LavenderBlush        : {color: ColorRGB.fromStrHex('#FFF0F5'), name: "LavenderBlush"       },
	SeaShell             : {color: ColorRGB.fromStrHex('#FFF5EE'), name: "SeaShell"            },
	Cornsilk             : {color: ColorRGB.fromStrHex('#FFF8DC'), name: "Cornsilk"            },
	LemonChiffon         : {color: ColorRGB.fromStrHex('#FFFACD'), name: "LemonChiffon"        },
	FloralWhite          : {color: ColorRGB.fromStrHex('#FFFAF0'), name: "FloralWhite"         },
	Snow                 : {color: ColorRGB.fromStrHex('#FFFAFA'), name: "Snow"                },
	Yellow               : {color: ColorRGB.fromStrHex('#FFFF00'), name: "Yellow"              },
	LightYellow          : {color: ColorRGB.fromStrHex('#FFFFE0'), name: "LightYellow"         },
	Ivory                : {color: ColorRGB.fromStrHex('#FFFFF0'), name: "Ivory"               },
	White                : {color: ColorRGB.fromStrHex('#FFFFFF'), name: "White"               }};

let color140Arr = [
	{name: "Black"                , color: color140.Black                , rev: color140.White          },
	{name: "Navy"                 , color: color140.Navy                 , rev: color140.Khaki          },
	{name: "DarkBlue"             , color: color140.DarkBlue             , rev: color140.Khaki          },
	{name: "MediumBlue"           , color: color140.MediumBlue           , rev: color140.Yellow         },
	{name: "Blue"                 , color: color140.Blue                 , rev: color140.Yellow         },
	{name: "DarkGreen"            , color: color140.DarkGreen            , rev: color140.Violet         },
	{name: "Green"                , color: color140.Green                , rev: color140.Violet         },
	{name: "Teal"                 , color: color140.Teal                 , rev: color140.LightCoral     },
	{name: "DarkCyan"             , color: color140.DarkCyan             , rev: color140.Salmon         },
	{name: "DeepSkyBlue"          , color: color140.DeepSkyBlue          , rev: color140.OrangeRed      },
	{name: "DarkTurquoise"        , color: color140.DarkTurquoise        , rev: color140.OrangeRed      },
	{name: "MediumSpringGreen"    , color: color140.MediumSpringGreen    , rev: color140.DeepPink       },
	{name: "Lime"                 , color: color140.Lime                 , rev: color140.Fuchsia        },
	{name: "SpringGreen"          , color: color140.SpringGreen          , rev: color140.DeepPink       },
	{name: "Aqua"                 , color: color140.Aqua                 , rev: color140.Red            },
	{name: "Cyan"                 , color: color140.Cyan                 , rev: color140.Red            },
	{name: "MidnightBlue"         , color: color140.MidnightBlue         , rev: color140.Khaki          },
	{name: "DodgerBlue"           , color: color140.DodgerBlue           , rev: color140.Maroon         },
	{name: "LightSeaGreen"        , color: color140.LightSeaGreen        , rev: color140.Maroon         },
	{name: "ForestGreen"          , color: color140.ForestGreen          , rev: color140.Orchid         },
	{name: "SeaGreen"             , color: color140.SeaGreen             , rev: color140.PaleVioletRed  },
	{name: "DarkSlateGray"        , color: color140.DarkSlateGray        , rev: color140.Tan            },
	{name: "LimeGreen"            , color: color140.LimeGreen            , rev: color140.DarkOrchid     },
	{name: "MediumSeaGreen"       , color: color140.MediumSeaGreen       , rev: color140.Maroon         },
	{name: "Turquoise"            , color: color140.Turquoise            , rev: color140.FireBrick      },
	{name: "RoyalBlue"            , color: color140.RoyalBlue            , rev: color140.DarkGoldenRod  },
	{name: "SteelBlue"            , color: color140.SteelBlue            , rev: color140.Peru           },
	{name: "DarkSlateBlue"        , color: color140.DarkSlateBlue        , rev: color140.DarkKhaki      },
	{name: "MediumTurquoise"      , color: color140.MediumTurquoise      , rev: color140.Brown          },
	{name: "Indigo"               , color: color140.Indigo               , rev: color140.PaleGreen      },
	{name: "DarkOliveGreen"       , color: color140.DarkOliveGreen       , rev: color140.DarkGray       },
	{name: "CadetBlue"            , color: color140.CadetBlue            , rev: color140.Brown          },
	{name: "CornflowerBlue"       , color: color140.CornflowerBlue       , rev: color140.SaddleBrown    },
	{name: "MediumAquaMarine"     , color: color140.MediumAquaMarine     , rev: color140.Brown          },
	{name: "DimGray"              , color: color140.DimGray              , rev: color140.LightSlateGray },
	{name: "SlateBlue"            , color: color140.SlateBlue            , rev: color140.YellowGreen    },
	{name: "OliveDrab"            , color: color140.OliveDrab            , rev: color140.DarkSlateBlue  },
	{name: "SlateGray"            , color: color140.SlateGray            , rev: color140.DarkViolet     },
	{name: "LightSlateGray"       , color: color140.LightSlateGray       , rev: color140.DarkViolet     },
	{name: "MediumSlateBlue"      , color: color140.MediumSlateBlue      , rev: color140.Khaki          },
	{name: "LawnGreen"            , color: color140.LawnGreen            , rev: color140.DarkViolet     },
	{name: "Chartreuse"           , color: color140.Chartreuse           , rev: color140.DarkViolet     },
	{name: "Aquamarine"           , color: color140.Aquamarine           , rev: color140.Maroon         },
	{name: "Maroon"               , color: color140.Maroon               , rev: color140.Aquamarine     },
	{name: "Purple"               , color: color140.Purple               , rev: color140.LightGreen     },
	{name: "Olive"                , color: color140.Olive                , rev: color140.DarkGreen      },
	{name: "Gray"                 , color: color140.Gray                 , rev: color140.DarkKhaki      },
	{name: "SkyBlue"              , color: color140.SkyBlue              , rev: color140.SaddleBrown    },
	{name: "LightSkyBlue"         , color: color140.LightSkyBlue         , rev: color140.SaddleBrown    },
	{name: "BlueViolet"           , color: color140.BlueViolet           , rev: color140.YellowGreen    },
	{name: "DarkRed"              , color: color140.DarkRed              , rev: color140.Aquamarine     },
	{name: "DarkMagenta"          , color: color140.DarkMagenta          , rev: color140.LightGreen     },
	{name: "SaddleBrown"          , color: color140.SaddleBrown          , rev: color140.SkyBlue        },
	{name: "DarkSeaGreen"         , color: color140.DarkSeaGreen         , rev: color140.DimGray        },
	{name: "LightGreen"           , color: color140.LightGreen           , rev: color140.Purple         },
	{name: "MediumPurple"         , color: color140.MediumPurple         , rev: color140.DarkKhaki      },
	{name: "DarkViolet"           , color: color140.DarkViolet           , rev: color140.LawnGreen      },
	{name: "PaleGreen"            , color: color140.PaleGreen            , rev: color140.Purple         },
	{name: "DarkOrchid"           , color: color140.DarkOrchid           , rev: color140.LimeGreen      },
	{name: "YellowGreen"          , color: color140.YellowGreen          , rev: color140.SlateBlue      },
	{name: "Sienna"               , color: color140.Sienna               , rev: color140.CornflowerBlue },
	{name: "Brown"                , color: color140.Brown                , rev: color140.MediumTurquoise},
	{name: "DarkGray"             , color: color140.DarkGray             , rev: color140.DarkSlateGray  },
	{name: "LightBlue"            , color: color140.LightBlue            , rev: color140.DarkOliveGreen },
	{name: "GreenYellow"          , color: color140.GreenYellow          , rev: color140.DarkViolet     },
	{name: "PaleTurquoise"        , color: color140.PaleTurquoise        , rev: color140.Maroon         },
	{name: "LightSteelBlue"       , color: color140.LightSteelBlue       , rev: color140.DarkOliveGreen },
	{name: "PowderBlue"           , color: color140.PowderBlue           , rev: color140.DarkOliveGreen },
	{name: "FireBrick"            , color: color140.FireBrick            , rev: color140.Turquoise      },
	{name: "DarkGoldenRod"        , color: color140.DarkGoldenRod        , rev: color140.RoyalBlue      },
	{name: "MediumOrchid"         , color: color140.MediumOrchid         , rev: color140.LimeGreen      },
	{name: "RosyBrown"            , color: color140.RosyBrown            , rev: color140.DimGray        },
	{name: "DarkKhaki"            , color: color140.DarkKhaki            , rev: color140.DarkSlateBlue  },
	{name: "Silver"               , color: color140.Silver               , rev: color140.DarkSlateGray  },
	{name: "MediumVioletRed"      , color: color140.MediumVioletRed      , rev: color140.MediumSeaGreen },
	{name: "IndianRed"            , color: color140.IndianRed            , rev: color140.Navy           },
	{name: "Peru"                 , color: color140.Peru                 , rev: color140.SteelBlue      },
	{name: "Chocolate"            , color: color140.Chocolate            , rev: color140.MediumBlue     },
	{name: "Tan"                  , color: color140.Tan                  , rev: color140.DarkSlateGray  },
	{name: "LightGray"            , color: color140.LightGray            , rev: color140.DarkSlateGray  },
	{name: "Thistle"              , color: color140.Thistle              , rev: color140.DarkSlateGray  },
	{name: "Orchid"               , color: color140.Orchid               , rev: color140.DarkSlateGray  },
	{name: "GoldenRod"            , color: color140.GoldenRod            , rev: color140.RoyalBlue      },
	{name: "PaleVioletRed"        , color: color140.PaleVioletRed        , rev: color140.DarkSlateGray  },
	{name: "Crimson"              , color: color140.Crimson              , rev: color140.Turquoise      },
	{name: "Gainsboro"            , color: color140.Gainsboro            , rev: color140.MidnightBlue   },
	{name: "Plum"                 , color: color140.Plum                 , rev: color140.ForestGreen    },
	{name: "BurlyWood"            , color: color140.BurlyWood            , rev: color140.MidnightBlue   },
	{name: "LightCyan"            , color: color140.LightCyan            , rev: color140.Black          },
	{name: "Lavender"             , color: color140.Lavender             , rev: color140.Black          },
	{name: "DarkSalmon"           , color: color140.DarkSalmon           , rev: color140.Teal           },
	{name: "Violet"               , color: color140.Violet               , rev: color140.Green          },
	{name: "PaleGoldenRod"        , color: color140.PaleGoldenRod        , rev: color140.MidnightBlue   },
	{name: "LightCoral"           , color: color140.LightCoral           , rev: color140.Teal           },
	{name: "Khaki"                , color: color140.Khaki                , rev: color140.MidnightBlue   },
	{name: "AliceBlue"            , color: color140.AliceBlue            , rev: color140.Black          },
	{name: "HoneyDew"             , color: color140.HoneyDew             , rev: color140.Black          },
	{name: "Azure"                , color: color140.Azure                , rev: color140.Black          },
	{name: "SandyBrown"           , color: color140.SandyBrown           , rev: color140.Teal           },
	{name: "Wheat"                , color: color140.Wheat                , rev: color140.MidnightBlue   },
	{name: "Beige"                , color: color140.Beige                , rev: color140.Black          },
	{name: "WhiteSmoke"           , color: color140.WhiteSmoke           , rev: color140.Black          },
	{name: "MintCream"            , color: color140.MintCream            , rev: color140.Black          },
	{name: "GhostWhite"           , color: color140.GhostWhite           , rev: color140.Black          },
	{name: "Salmon"               , color: color140.Salmon               , rev: color140.Teal           },
	{name: "AntiqueWhite"         , color: color140.AntiqueWhite         , rev: color140.Black          },
	{name: "Linen"                , color: color140.Linen                , rev: color140.Black          },
	{name: "LightGoldenRodYellow" , color: color140.LightGoldenRodYellow , rev: color140.Black          },
	{name: "OldLace"              , color: color140.OldLace              , rev: color140.Black          },
	{name: "Red"                  , color: color140.Red                  , rev: color140.Aqua           },
	{name: "Fuchsia"              , color: color140.Fuchsia              , rev: color140.Lime           },
	{name: "Magenta"              , color: color140.Magenta              , rev: color140.Lime           },
	{name: "DeepPink"             , color: color140.DeepPink             , rev: color140.SpringGreen    },
	{name: "OrangeRed"            , color: color140.OrangeRed            , rev: color140.DarkBlue       },
	{name: "Tomato"               , color: color140.Tomato               , rev: color140.DarkBlue       },
	{name: "HotPink"              , color: color140.HotPink              , rev: color140.SeaGreen       },
	{name: "Coral"                , color: color140.Coral                , rev: color140.Teal           },
	{name: "DarkOrange"           , color: color140.DarkOrange           , rev: color140.DodgerBlue     },
	{name: "LightSalmon"          , color: color140.LightSalmon          , rev: color140.Teal           },
	{name: "Orange"               , color: color140.Orange               , rev: color140.DodgerBlue     },
	{name: "LightPink"            , color: color140.LightPink            , rev: color140.DarkSlateGray  },
	{name: "Pink"                 , color: color140.Pink                 , rev: color140.DarkGreen      },
	{name: "Gold"                 , color: color140.Gold                 , rev: color140.Blue           },
	{name: "PeachPuff"            , color: color140.PeachPuff            , rev: color140.MidnightBlue   },
	{name: "NavajoWhite"          , color: color140.NavajoWhite          , rev: color140.MidnightBlue   },
	{name: "Moccasin"             , color: color140.Moccasin             , rev: color140.MidnightBlue   },
	{name: "Bisque"               , color: color140.Bisque               , rev: color140.MidnightBlue   },
	{name: "MistyRose"            , color: color140.MistyRose            , rev: color140.Black          },
	{name: "BlanchedAlmond"       , color: color140.BlanchedAlmond       , rev: color140.Black          },
	{name: "PapayaWhip"           , color: color140.PapayaWhip           , rev: color140.Black          },
	{name: "LavenderBlush"        , color: color140.LavenderBlush        , rev: color140.Black          },
	{name: "SeaShell"             , color: color140.SeaShell             , rev: color140.Black          },
	{name: "Cornsilk"             , color: color140.Cornsilk             , rev: color140.Black          },
	{name: "LemonChiffon"         , color: color140.LemonChiffon         , rev: color140.Black          },
	{name: "FloralWhite"          , color: color140.FloralWhite          , rev: color140.Black          },
	{name: "Snow"                 , color: color140.Snow                 , rev: color140.Black          },
	{name: "Yellow"               , color: color140.Yellow               , rev: color140.Blue           },
	{name: "LightYellow"          , color: color140.LightYellow          , rev: color140.Black          },
	{name: "Ivory"                , color: color140.Ivory                , rev: color140.Black          },
	{name: "White"                , color: color140.White                , rev: color140.Black          }];

