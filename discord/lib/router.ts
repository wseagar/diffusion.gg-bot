import {
  ButtonInteraction,
  CacheType,
  SelectMenuInteraction,
  ChatInputCommandInteraction,
  Interaction,
  ModalSubmitInteraction,
} from "discord.js";

type Handler<T> = {
  customId: string;
  fn: (interaction: T) => Promise<void>;
  startsWith: boolean;
};

export class Router {
  buttonHandlers: Handler<ButtonInteraction<CacheType>>[] = [];
  selectHandlers: Handler<SelectMenuInteraction<CacheType>>[] = [];
  chatHandlers: Handler<ChatInputCommandInteraction<CacheType>>[] = [];
  modalHandlers: Handler<ModalSubmitInteraction<CacheType>>[] = [];

  modal(commandName: string, fn: (interaction: ModalSubmitInteraction<CacheType>) => Promise<void>) {
    this.modalHandlers.push({ customId: commandName, fn, startsWith: false });
  }

  modalStartsWith(commandName: string, fn: (interaction: ModalSubmitInteraction<CacheType>) => Promise<void>) {
    this.modalHandlers.push({ customId: commandName, fn, startsWith: true });
  }

  chat(commandName: string, fn: (interaction: ChatInputCommandInteraction<CacheType>) => Promise<void>) {
    this.chatHandlers.push({ customId: commandName, fn, startsWith: false });
  }

  chatStartsWith(commandName: string, fn: (interaction: ChatInputCommandInteraction<CacheType>) => Promise<void>) {
    this.chatHandlers.push({ customId: commandName, fn, startsWith: true });
  }

  select(customId: string, fn: (interaction: SelectMenuInteraction<CacheType>) => Promise<void>) {
    this.selectHandlers.push({ customId, fn, startsWith: false });
  }

  selectStartsWith(customId: string, fn: (interaction: SelectMenuInteraction<CacheType>) => Promise<void>) {
    this.selectHandlers.push({ customId, fn, startsWith: true });
  }

  button(customId: string, fn: (interaction: ButtonInteraction<CacheType>) => Promise<void>) {
    this.buttonHandlers.push({ customId, fn, startsWith: false });
  }

  buttonStartsWith(customId: string, fn: (interaction: ButtonInteraction<CacheType>) => Promise<void>) {
    this.buttonHandlers.push({ customId, fn, startsWith: true });
  }

  private async findAndRun<T extends Interaction>(interaction: T, idProperty: string, handlers: Handler<T>[]) {
    console.log("interaction: ", idProperty);
    const handler = handlers.find((handler) => {
      if (handler.startsWith) {
        console.log("checking: " + handler.customId + "|");
        const result = idProperty.startsWith(`${handler.customId}|`);

        return result;
      } else {
        return handler.customId === idProperty;
      }
    });
    if (!handler) {
      console.log("Couldn't find: ", idProperty);
      return;
    }
    console.log(
      `[${handler.customId}]: ${idProperty}, ${interaction.user.username}:${interaction.user.id}, ${interaction.guild?.name}:${interaction.guild?.id}`,
    );
    await handler.fn(interaction);
  }

  async execute(interaction: Interaction<CacheType>) {
    if (interaction.isSelectMenu()) {
      await this.findAndRun(interaction, interaction.customId, this.selectHandlers);
      return;
    }
    if (interaction.isButton()) {
      await this.findAndRun(interaction, interaction.customId, this.buttonHandlers);
      return;
    }
    if (interaction.isChatInputCommand()) {
      await this.findAndRun(interaction, interaction.commandName, this.chatHandlers);
      return;
    }

    if (interaction.isModalSubmit()) {
      await this.findAndRun(interaction, interaction.customId, this.modalHandlers);
    }
  }
}
