// imports the React Javascript Library
import React from "react";
//Card
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";


//Tabs
import { withStyles } from "@mui/material/styles";

const styles = theme => ({
  root: {
    width: 500,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end"
  },
  input: {
    display: "none"
  },
  img: {
    width: 200,
    height: 256,
    margin: "auto",
    display: "block",
    maxWidth: "100%",
    maxHeight: "100%"
  }
});

class ImageUploadCard extends React.Component {
  state = {
    mainState: "initial", // initial
    imageUploaded: 0,
    selectedFile: this.props.initialUrl + ''
  };

  handleUploadClick = event => {
    console.log();
    var file = event.target.files[0];
    const reader = new FileReader();
    var url = reader.readAsDataURL(file);

    reader.onloadend = function (e) {
      this.setState({
        selectedFile: [reader.result]
      });
    }.bind(this);
    console.log(url); // Would see a path?

    this.setState({
      mainState: "uploaded",
      selectedFile: event.target.files[0],
      imageUploaded: 1
    });
  };

  renderInitialState() {
    const { classes, theme } = this.props;
    const { value } = this.state;
    console.log(this.props.initialUrl)
    return (
      <Grid container direction="column" alignItems="center">
        <Grid item>
          <img
            width="100%"

            src={this.state.selectedFile}
          />
        </Grid>
        <label htmlFor="contained-button-file">
          <Button variant="contained" component="span">
            Select Image:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <input
              accept="image/*"

              id="contained-button-file"
              multiple
              type="file"
              onChange={this.handleUploadClick}
            />
          </Button>
        </label>
      </Grid>
    );
  }

  renderUploadedState() {
    const { classes, theme } = this.props;

    return (
      <Grid container direction="column" alignItems="center">
        <Grid item>
          <img
            width="100%"

            src={this.state.selectedFile}
          />
        </Grid>
        <label htmlFor="contained-button-file">
          <Button variant="contained" component="span">
            Select Image
            <input
              accept="image/*"

              id="contained-button-file"
              multiple
              type="file"
              onChange={this.handleUploadClick}
            />
          </Button>
        </label>
      </Grid>
    );
  }

  render() {
    const { classes, theme } = this.props;

    return (
      <div >
        <Card >
          {(this.state.mainState == "initial" && this.renderInitialState()) ||
            (this.state.mainState == "uploaded" && this.renderUploadedState())}
        </Card>
      </div>
    );
  }
}

//export default withStyles(styles, { withTheme: true })(ImageUploadCard);
export default ImageUploadCard;