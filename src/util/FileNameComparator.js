// FileNameComparator.js
export default class FileNameComparator {
    compare(o1, o2) {
        const c1 = o1.toLowerCase().split('');
        const c2 = o2.toLowerCase().split('');
        const len = Math.min(c1.length, c2.length);

        for (let i = 0; i < len; i++) {
            const diff = this.replace(c1[i]) - this.replace(c2[i]);
            if (diff !== 0) return diff;
        }
        return c1.length - c2.length;
    }

    replace(c) {
        switch (c) {
            case '_': return '/';
            case '一': return '一'.charCodeAt(0);
            case '二': return '一'.charCodeAt(0) + 1;
            case '三': return '一'.charCodeAt(0) + 2;
            case '四': return '一'.charCodeAt(0) + 3;
            case '五': return '一'.charCodeAt(0) + 4;
            case '六': return '一'.charCodeAt(0) + 5;
            case '七': return '一'.charCodeAt(0) + 6;
            case '八': return '一'.charCodeAt(0) + 7;
            case '九': return '一'.charCodeAt(0) + 8;
            case '十': return '一'.charCodeAt(0) + 9;
            case '上': return '上'.charCodeAt(0);
            case '前': return '上'.charCodeAt(0) + 1;
            case '中': return '上'.charCodeAt(0) + 2;
            case '下': return '上'.charCodeAt(0) + 3;
            case '後': return '上'.charCodeAt(0) + 4;
            default: return c.charCodeAt(0);
        }
    }
}
