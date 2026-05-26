module.exports = {
  gerarSlots: (startTime, endTime, dateRequested) => {
    if (!dateRequested) {
      throw new Error("Data é obrigatória!");
    }

    let baseDate =
      typeof dateRequested === "string"
        ? new Date(dateRequested)
        : new Date(dateRequested);

    if (isNaN(baseDate.getTime())) {
      throw new Error(`Data inválida: ${dateRequested}`);
    }

    baseDate.setHours(0, 0, 0, 0);

    const slots = [];

    for (let hour = startTime; hour < endTime; hour++) {
      const slot = new Date(baseDate);
      slot.setHours(hour, 0, 0, 0);
      slots.push(slot);
    }

    return slots;
  },
};
