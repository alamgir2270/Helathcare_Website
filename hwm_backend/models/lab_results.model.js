module.exports = (sequelize, DataTypes) => {
  const LabResult = sequelize.define(
    "LabResult",
    {
      lab_result_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      appointment_id: { type: DataTypes.UUID },
      patient_id: { type: DataTypes.UUID },

      test_type: { type: DataTypes.STRING(100) },
      result_data: { type: DataTypes.BLOB },
      result_date: { type: DataTypes.DATEONLY },

      status: { type: DataTypes.STRING(50) },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "lab_results",
      timestamps: false,
    }
  );

  return LabResult;
};
