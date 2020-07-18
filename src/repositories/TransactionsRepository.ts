import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const balance = {
      income: 0,
      outcome: 0,
      total: 0
    };

    const transactions = await this.find();

    balance.income = transactions
      .filter(transaction => transaction.type === 'income')
      .reduce((acumulator: number, { value }) => {
        return acumulator + value;
      }, 0);

    balance.outcome = transactions
      .filter(transaction => transaction.type === 'outcome')
      .reduce((acumulator: number, { value }) => {
        return acumulator + value;
      }, 0);

    balance.total = balance.income - balance.outcome;

    return balance;
  }
}

export default TransactionsRepository;
