/* inspired by https://stackoverflow.com/a/30686832 */

/**
 * provides a sequence of string in order, i.e. 'aaa', 'aab' etc
 * warps around when the target is reached
 */
export class StringSequence {
    private initialNumber = 0;
    private currentNumber = 0;
    private targetNumber = 0;

    constructor(
        from: string,
        to: string,
        private padSize = 4,
        private alphabetSize = 26,
    ) {
        this.initialNumber = this.stringToNumber(from);
        this.currentNumber = this.initialNumber - 1;
        this.targetNumber = this.stringToNumber(to);
    }

    public getNextString = (
        /** throws if the current string if the target one */
        throwOnTargetExcceeded?: boolean,
    ): string => {
        this.currentNumber++;
        if (this.currentNumber > this.targetNumber) {
            if (throwOnTargetExcceeded) {
                throw new Error(`Target string reached`);
            }
            this.currentNumber = this.initialNumber;
        }
        return this.pad(this.numberToString(this.currentNumber));
    };

    private stringToNumber(string: string) {
        let power = 0;
        let number = 0;
        let i = 0;
        while (i++ < string.length) {
            power = Math.pow(this.alphabetSize, string.length - i);
            number += (string.charCodeAt(i - 1) - 97) * power;
        }
        return number;
    }

    private numberToString(number?: number) {
        let string = '';
        if (!number) {
            string = 'a';
        } else {
            while (number) {
                string =
                    String.fromCharCode(97 + (number % this.alphabetSize)) +
                    string;
                number = Math.floor(number / this.alphabetSize);
            }
        }
        return string;
    }

    /**
     * pads the string by prepending 'a' at the start of it until the padSize is reached
     */
    private pad(string): string {
        while (string.length < this.padSize) {
            string = 'a' + string;
        }
        return string;
    }
}
