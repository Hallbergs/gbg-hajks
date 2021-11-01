import React from "react";
import { Button, Grid, Typography } from "@material-ui/core";
import { Select, FormControl, InputLabel, MenuItem } from "@material-ui/core";
import { Step, StepContent, StepLabel, Stepper } from "@material-ui/core";
import DrawToolbox from "./DrawToolbox";

const FmeServerView = (props) => {
  const { localObserver } = props;
  // We're gonna need some state, e.g. which step are we on,
  // or which product-group the user has selected.
  const [activeStep, setActiveStep] = React.useState(2);
  const [activeGroup, setActiveGroup] = React.useState("");
  const [activeProduct, setActiveProduct] = React.useState("");
  const [activeDrawButton, setActiveDrawButton] = React.useState("");
  const [drawCompleted, setDrawCompleted] = React.useState(false);
  const [drawError, setDrawError] = React.useState(false);

  // Let's create an object with all the steps to be rendered. This
  // will allow us to add another step in a simple manner.
  const steps = [
    { label: "Välj grupp", renderFunction: renderChooseGroupStep },
    { label: "Välj produkt", renderFunction: renderChooseProductStep },
    { label: "Välj omfattning", renderFunction: renderDrawGeometryStep },
    { label: "Fyll i parametrar", renderFunction: renderEnterParametersStep },
    { label: "Beställ", renderFunction: renderOrderStep },
    { label: "Klart!", renderFunction: renderDoneStep },
  ];

  // In this effect we make sure to subscribe to all events emitted by
  // the mapViewModel and fmeServerModel.
  React.useEffect(() => {
    localObserver.subscribe("map.drawCompleted", (drawInformation) => {
      handleDrawCompleted(drawInformation);
    });
    return () => {
      // We must make sure to unsubscribe on unmount.
      localObserver.unSubscribe("map.drawCompleted");
    };
  }, [localObserver]);

  // If the user reaches the last step, they will be able to reset
  // the stepper. If they do, there will be some cleanup done.
  function handleResetStepper() {
    setActiveStep(0);
    setActiveGroup("");
    setDrawCompleted(false);
    setDrawError(false);
  }

  function handleDrawButtonClick(buttonType) {
    // The reset button should not be toggled (even if it is a toggle-button...)
    // We should only reset the draw state and move on.
    if (buttonType === "RESET") {
      localObserver.publish("map.resetDrawing");
      setDrawCompleted(false);
      setDrawError(false);
      return;
    }
    // If the user clicks the button that is currently active, we must set
    // that button inactive again.
    if (activeDrawButton === buttonType) {
      localObserver.publish("map.toggleDrawMethod", "");
      return setActiveDrawButton("");
    }
    // Otherwise, we set the button active!
    localObserver.publish("map.toggleDrawMethod", buttonType);
    return setActiveDrawButton(buttonType);
  }

  function handleDrawCompleted(drawInformation) {
    setDrawCompleted(drawInformation.error ? false : true);
    setDrawError(drawInformation.error ? true : false);
  }

  // Returns an array of products, where each product belongs
  // to the currently active group.
  function getProductsInActiveGroup() {
    return props.options.products.filter((product) => {
      return product.group === activeGroup;
    });
  }

  // A function to render the stepper-buttons (next, back reset).
  // Used to limit code rewrite.
  // Accepts: An array of objects on {type: string, disabled: bool} form.
  function renderStepperButtons(buttons) {
    return (
      <Grid container item justify="flex-end">
        {buttons.map((button, index) => {
          return (
            <Button
              key={index}
              style={{ marginTop: 8, marginLeft: 8 }}
              disabled={button.disabled}
              variant="contained"
              onClick={
                button.type === "back"
                  ? () => setActiveStep(activeStep - 1)
                  : button.type === "next"
                  ? () => setActiveStep(activeStep + 1)
                  : () => handleResetStepper()
              }
            >
              {button.type === "back"
                ? "Tillbaka"
                : button.type === "next"
                ? "Nästa"
                : "Börja om!"}
            </Button>
          );
        })}
      </Grid>
    );
  }

  // Renders the content for the step where the user can select
  // which group they want to get their products from. If no group is selected,
  // the user cannot continue to the next step.
  function renderChooseGroupStep() {
    return (
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="fme-server-select-group-label">Grupp</InputLabel>
            <Select
              labelId="fme-server-select-group-label"
              id="fme-server-select-group"
              value={activeGroup}
              label="Grupp"
              onChange={(e) => setActiveGroup(e.target.value)}
            >
              {props.options.productGroups.map((group, index) => {
                return (
                  <MenuItem value={group} key={index}>
                    {group}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
        {
          // Since this is the first step, we only need a "next" button. We can't
          // go back to step -1.
          renderStepperButtons([{ type: "next", disabled: activeGroup === "" }])
        }
      </Grid>
    );
  }

  // Renders the content for the step where the user can select
  // which product they want to run.
  function renderChooseProductStep() {
    // We only want to render the products that belong to the active group,
    // so letch get those.
    const productsInActiveGroup = getProductsInActiveGroup();
    return (
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="fme-server-select-product-label">
              Produkt
            </InputLabel>
            <Select
              labelId="fme-server-select-product-label"
              id="fme-server-select-product"
              value={activeProduct}
              label="Produkt"
              onChange={(e) => setActiveProduct(e.target.value)}
            >
              {productsInActiveGroup.map((product, index) => {
                return (
                  <MenuItem value={product.name} key={index}>
                    {product.name}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
        {
          // In this step we need both a "back" and a "next" button, since the
          // user might want to change the selected group along the way
          renderStepperButtons([
            { type: "back", disabled: false },
            { type: "next", disabled: activeProduct === "" },
          ])
        }
      </Grid>
    );
  }

  // Renders the content for the step where the user can draw the area
  // for which the ordered product perform calculations.
  function renderDrawGeometryStep() {
    return (
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <Typography variant="caption">
            Välj ritverktyg nedan för att rita beställningens omfattning.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <DrawToolbox
            activeDrawButton={activeDrawButton}
            handleDrawButtonClick={handleDrawButtonClick}
          />
        </Grid>
        {drawError && (
          <Grid item xs={12}>
            <Typography variant="caption">
              Den ritade ytan är för stor. Ta bort den och försök igen för att
              kunna gå vidare med beställningen!
            </Typography>
          </Grid>
        )}
        {
          // If the drawing is not completed, or if the drawing contains an error,
          // we won't let the user continue on.
          renderStepperButtons([
            { type: "back", disabled: false },
            { type: "next", disabled: !drawCompleted || drawError },
          ])
        }
      </Grid>
    );
  }

  function renderEnterParametersStep() {
    return (
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <Typography>Ange parmaterar</Typography>
        </Grid>
        {renderStepperButtons([
          { type: "back", disabled: false },
          { type: "next", disabled: false },
        ])}
      </Grid>
    );
  }

  function renderOrderStep() {
    return (
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <Typography>Beställ</Typography>
        </Grid>
        {renderStepperButtons([
          { type: "back", disabled: false },
          { type: "next", disabled: false },
        ])}
      </Grid>
    );
  }

  function renderDoneStep() {
    return (
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <Typography>Klart!</Typography>
        </Grid>
        {renderStepperButtons([{ type: "reset", disabled: false }])}
      </Grid>
    );
  }

  return (
    <Stepper
      activeStep={activeStep}
      orientation="vertical"
      style={{ padding: 8 }}
    >
      {steps.map((step, index) => {
        return (
          <Step key={index}>
            <StepLabel>{step.label}</StepLabel>
            <StepContent>{step.renderFunction()}</StepContent>
          </Step>
        );
      })}
    </Stepper>
  );
};

export default FmeServerView;
