import express from 'express';
import { accountModel } from '../models/Account.js';

const app = express();

app.patch('/deposito/:agencia/:conta', async (req, res) => {
  try {
    const { agencia, conta } = req.params;
    const account = await accountModel.findOne({
      agencia: agencia,
      conta: conta,
    });
    if (!account) {
      res.status(404).send('Conta não localizada!');
    } else {
      const newBalance = account.balance + req.body.deposito;
      await accountModel.updateOne(
        { agencia: agencia, conta: conta },
        { $set: { balance: newBalance } }
      );
      res.send('Depósito realizado com sucesso. Saldo atual = ' + newBalance);
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

app.patch('/saque/:agencia/:conta', async (req, res) => {
  try {
    const { agencia, conta } = req.params;
    const account = await accountModel.findOne({
      agencia: agencia,
      conta: conta,
    });
    if (!account) {
      res.status(404).send('Conta não localizada!');
    } else {
      if (account.balance <= req.body.saque) {
        res.send('Operação não realizada. Saldo da conta insuficiente');
      } else {
        const tax = 1;
        const newBalance = account.balance - req.body.saque - tax;
        await accountModel.updateOne(
          { agencia: agencia, conta: conta },
          { $set: { balance: newBalance } }
        );
        res.send('Saque realizado com sucesso. Saldo atual = ' + newBalance);
      }
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/saldo/:agencia/:conta', async (req, res) => {
  try {
    const { agencia, conta } = req.params;
    const account = await accountModel.findOne({
      agencia: agencia,
      conta: conta,
    });
    if (!account) {
      res.status(404).send('Conta não localizada!');
    } else {
      res.send('Saldo = ' + account.balance);
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

app.delete('/deletar/:agencia/:conta', async (req, res) => {
  try {
    const { agencia, conta } = req.params;
    const account = await accountModel.findOne({
      agencia: agencia,
      conta: conta,
    });

    if (!account) {
      res.status(404).send('Conta não localizada!');
    } else {

      await accountModel.deleteOne({
        agencia: agencia,
        conta: conta,
      });
      const qttContas = await accountModel.count({agencia: agencia});

      res.send('Conta deletada com sucesso. Agência '+agencia+' = '+qttContas+' contas ativas');
    }
  } catch (error) {
    res.status(500).send(error);
  }
});


app.patch('/transferencia/:origin/:destination', async (req, res) => {
  try {
    const { origin, destination } = req.params;
    let valueOrigin = 0;
    let valueDestination = 0;
    const accountOrigin = await accountModel.findOne({
      conta: origin,
    });
    const accountDestination = await accountModel.findOne({
      conta: destination,
    });

    if (accountOrigin.agencia === accountDestination.agencia) {
      valueOrigin = accountOrigin.balance - req.body.value;
    } else {
      const tax = 8;
      valueOrigin = accountOrigin.balance - req.body.value - tax;
    }

    await accountModel.updateOne(
      {agencia: accountOrigin.agencia, conta: accountOrigin.conta},
      { $set: { balance: valueOrigin } }
    );

    valueDestination = accountDestination.balance + req.body.value;
    await accountModel.updateOne(
      {agencia: accountDestination.agencia, conta: accountDestination.conta},
      { $set: { balance: valueDestination } }
    );

    res.send(`Saldo da conta origem(${accountOrigin.conta}) = ${valueOrigin}`);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/media/:agencia', async (req, res) => {
  try {
    const { agencia } = req.params;
    const avgContas = await accountModel.aggregate([{$match: {agencia: parseInt(agencia)}}, {$group: {_id: null, media: {$avg: "$balance"}}}]);

    res.send(`Valor médio da agencia ${agencia} = ${avgContas[0].media}`);
    
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/saldomin/:qtt', async (req, res) => {
  try {
    const { qtt } = req.params;
    const saldomin = await accountModel.find({}).limit(parseInt(qtt)).sort({balance: 1});
    res.send(saldomin);
    
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/saldomax/:qtt', async (req, res) => {
  try {
    const { qtt } = req.params;
    const saldomax = await accountModel.find({}).limit(parseInt(qtt)).sort({balance: -1}).sort({name: 1});

    res.send(saldomax);
    
  } catch (error) {
    res.status(500).send(error);
  }
});


app.patch('/maxsaldos', async (req, res) => {
  try {
    const maxSaldos = await accountModel.aggregate([{$group: {_id: {agencia: "$agencia"}, maxSaldo: {$max: "$balance"}}}]);

    maxSaldos.forEach(async ms => {
        await accountModel.updateOne(
        {agencia: ms._id.agencia, balance: ms.maxSaldo},
        { $set: { agencia: 99 } }
      );
    });

    const agencia99 = await accountModel.find({agencia:99});
    res.send(agencia99);
    
  } catch (error) {
    res.status(500).send(error);
  }
});

export { app as accountRouter };
