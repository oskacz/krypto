import { Kalkulator } from './../../shared/services/kal.model';
import { Component, OnInit, NgModule } from '@angular/core';
import { KalService } from '../../shared/services/kal.service';
import { HtmlParser } from '@angular/compiler';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-kalkulator',
  templateUrl: './kalkulator.component.html',
  styleUrls: ['./kalkulator.component.css']
})
export class KalkulatorComponent implements OnInit {
  bitbay = {
    BTC: 0.00045,
    LTC: 0.005,
    ETH: 0.00126,
    LSK: 0.2,
    BCC: 0.0006,
    GAME: 0.005,
    DASH: 0.001,
    BTG: 0.0008,
    KZC: 0.0005,
    XIN: 2,
    XRP: 0.1,
  }

  bitbayBids = {
    LTC: [],
    ETH: [],
    LSK: [],
    BCC: [],
    GAME: [],
    DASH: [],
    BTG: [],
    KZC: [],
    XIN: [],
    XRP: [],
  }

  bitbayAsks = {
    LTC: [],
    ETH: [],
    LSK: [],
    BCC: [],
    GAME: [],
    DASH: [],
    BTG: [],
    KZC: [],
    XIN: [],
    XRP: [],
  }

  wynik: any[] = []

  bitbayKeys: string[] = Object.keys(this.bitbay);

  poloniexFee: any[];

  bitbayFee;

  polkeys: string[];

  polOrderbook: any[]

  kupWalute: number;

  constructor(private klServ: KalService) {
    klServ.getBitbayFee().subscribe(d => this.bitbayFee = this.parseBitbay(d["_body"]));

    klServ.getPoloniexFee().subscribe(d => this.poloniexFee = d.json());

    klServ.getPoloniexOrderbook().subscribe(d => {
      this.polkeys = Object.keys(d.json());
      this.polOrderbook = d.json();
    })
    for (let i = 0; i < this.bitbayKeys.length; i++) {
      klServ.getBitbayOrderbook(this.bitbayKeys[i]).subscribe(d => {
        if (this.bitbayKeys[i] != "BTC") {
          this.bitbayBids[this.bitbayKeys[i]] = d.json()['bids'];
          this.bitbayAsks[this.bitbayKeys[i]] = d.json()['asks'];
        }
      })
    }
  }
  
  ngOnInit() {
  }

  parseBitbay(str) {
    let myRe = /[aA-zZ]{3,4}:\s[0-9]{1,6}(\.*[0-9]{0,8})/g;
    let waluta_fee: string[] = [];
    let myArray: any[];
    let i = 0;
    while ((myArray = myRe.exec(str)) !== null && i < 11) {
      let msg: string = myArray[0];
      if (msg.substring(0, 3) != "NIP") {
        waluta_fee.push(msg);
      }
      i++;
    }
    return waluta_fee;
  }

  dodajKalk(f: NgForm) {
    if (f.value.bazowa == "Poloniex") {
      this.kupPoloniex(f);
    } else if (f.value.bazowa == "Bitbay") {
      this.kubBitbay(f);
    }
  }

  kubBitbay(f: NgForm) {
    this.wynik = []
    let ilosc: number = f.value.ilosc;
    for (let i = 0; i < this.polkeys.length; i++) {
      if (this.polkeys[i].substr(0, 3) === "BTC") {
        let waluta_waluta: string[] = this.polkeys[i].split('_');
        if (-1 != this.bitbayKeys.indexOf(waluta_waluta[1]) && this.bitbayKeys[i] != "BTC") {
          let suma = 0;
          let ilosc_krypto = 0;
          for (let entry of this.bitbayAsks[waluta_waluta[1]]) {
            if ((suma + entry[0] * entry[1]) < ilosc) {
              suma += entry[0] * entry[1];
              ilosc_krypto += entry[1];
            } else {
              ilosc_krypto += (ilosc - suma) / entry[0];
              suma += ilosc - suma;
              this.kupWalute = ilosc_krypto;
              this.kupWalute -= this.bitbay[waluta_waluta[1]];
              break;
            }
          }
          ilosc_krypto = this.kupWalute;
          let ilosc_game: number = 0;
          let ilosc_kupionego_btc: number = 0;
          for (let cena_ilosc of this.polOrderbook[this.polkeys[i]]["bids"]) {
            if ((ilosc_game + cena_ilosc[1]) < this.kupWalute) {
              ilosc_game += cena_ilosc[1];
              ilosc_kupionego_btc += cena_ilosc[0] * cena_ilosc[1];
            }
            else if ((ilosc_game + cena_ilosc[1]) > this.kupWalute) {
              ilosc_kupionego_btc += cena_ilosc[0] * (this.kupWalute - ilosc_game);
              ilosc_game += this.kupWalute - ilosc_game;
              this.wynik.push([waluta_waluta[1], ilosc_kupionego_btc])
              break;
            }
          }
        }
      }
    }
    let withoutWithdraw: number = ilosc - this.bitbay["BTC"];
    this.wynik.push(["BTC", withoutWithdraw]);
    this.wynik.sort((a: any, b: any) => {
      return + b[1] - +a[1];
    });
    for (let entry of this.wynik) {
      entry[1] = Math.round(entry[1] * 100000000) / 100000000;
    }
  }

  kupPoloniex(f: NgForm) {
    this.wynik = []
    let ilosc: number = f.value.ilosc;
    for (let i = 0; i < this.polkeys.length; i++) {
      if (this.polkeys[i].substr(0, 3) === "BTC") {
        let waluta_waluta: string[] = this.polkeys[i].split('_');
        if (-1 != this.bitbayKeys.indexOf(waluta_waluta[1]) && this.bitbayKeys[i] != "BTC") {
          let suma = 0;
          let ilosc_krypto = 0;
          for (let entry of this.polOrderbook[this.polkeys[i]]["asks"]) {
            if ((suma + entry[0] * entry[1]) < ilosc) {
              suma += entry[0] * entry[1];
              ilosc_krypto += entry[1];

            } else {
              ilosc_krypto += (ilosc - suma) / entry[0];
              suma += ilosc - suma;
              this.kupWalute = ilosc_krypto;
              this.kupWalute -= this.poloniexFee[waluta_waluta[1]]['txFee'];
              break;
            }
          }
          ilosc_krypto = this.kupWalute;
          let ilosc_game: number = 0;
          let ilosc_kupionego_btc: number = 0;
          for (let cena_ilosc of this.bitbayBids[waluta_waluta[1]]) {
            if ((ilosc_game + cena_ilosc[1]) < this.kupWalute) {
              ilosc_game += cena_ilosc[1];
              ilosc_kupionego_btc += cena_ilosc[0] * cena_ilosc[1];
            }
            else if ((ilosc_game + cena_ilosc[1]) > this.kupWalute) {
              ilosc_kupionego_btc += cena_ilosc[0] * (this.kupWalute - ilosc_game);
              ilosc_game += this.kupWalute - ilosc_game;
              this.wynik.push([waluta_waluta[1], ilosc_kupionego_btc])
              break;
            }
          }
        }
      }
    }
    let withoutWithdraw: number = ilosc - this.poloniexFee["BTC"]['txFee'];
    this.wynik.push(["BTC", withoutWithdraw]);
    this.wynik.sort((a: any, b: any) => {
      return + b[1] - +a[1];
    });
    for (let entry of this.wynik) {
      entry[1] = Math.round(entry[1] * 100000000) / 100000000;
    }
  }




}
