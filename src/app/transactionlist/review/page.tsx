"use client";
import { Transaction_review } from "@/interfaces";
import { ROOT_URL, endpoints } from "@/urls";
import {
  Box,
  Button,
  Container,
  Rating,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Review() {
  const [data, setData] = useState<Transaction_review>({
    order_id: "",
    rating: "",
    feedback: "",
  });
  const searchParams = useSearchParams();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [reviewed, setReviewed] = useState(true);
  console.log("rating=" + rating);
  console.log(
    "reviewed=" +
      searchParams.get("reviewed") +
      typeof searchParams.get("reviewed")
  );

  useEffect(() => {
    if (searchParams.get("reviewed") === "1") {
      fetch(
        ROOT_URL + endpoints.transaction.getReview + `${searchParams.get("id")}`
      )
        .then((res) => res.json())
        .then((data) => {
          console.log("data=" + data);
          setData(data);
        });
    }
  }, []);
  function submitFeedback() {
    fetch(ROOT_URL + endpoints.transaction.updateReview, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id: searchParams.get("id"),
        rating: rating,
        feedback: feedback,
      }),
    }).then((res) => {
      if (res.status === 200) {
        window.alert("Successful !");
        router.push(`/transactionlist`);
      } else {
        window.alert("error");
      }
    });
  }
  const handleRatingChange = (
    event: React.SyntheticEvent<Element, Event>,
    newRating: number | null
  ) => {
    if (newRating != null) {
      setRating(newRating);
    }
  };

  const handleFeedbackChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | undefined
  ) => {
    if (event != undefined) {
      setFeedback(event.target.value);
      console.log(feedback);
    }
  };

  return (
    <Container component="main" maxWidth="lg">
      <Box component="form" noValidate sx={{ flexGrow: 1 }}>
        <Toolbar />
        <div>
          <Typography variant="h3" gutterBottom marginBottom={4}>
            Transaction #{searchParams.get("id")} Feedback
          </Typography>
          <Box marginBottom={4}>
            <Typography variant="h4">Rate: </Typography>
            {searchParams.get("reviewed") === "0" && (
              <Rating
                name="order-rating"
                value={rating}
                precision={1}
                onChange={handleRatingChange}
              />
            )}
            {searchParams.get("reviewed") === "1" && (
              <Typography variant="h4">{+data.rating} </Typography>
            )}
          </Box>
          <Box marginBottom={4}>
            <Typography variant="h4" marginBottom={2}>
              Feedback:
            </Typography>
            {searchParams.get("reviewed") === "0" && (
              <TextField
                multiline
                rows={5}
                value={feedback}
                onChange={handleFeedbackChange}
                sx={{ width: "60vw" }}
              />
            )}
            {searchParams.get("reviewed") === "1" && (
              <TextField
                disabled
                multiline
                rows={5}
                value={data.feedback}
                onChange={handleFeedbackChange}
                sx={{ width: "60vw" }}
              />
            )}
          </Box>
          <Button
            sx={{ mt: 3, mr: 1 }}
            variant="contained"
            color="primary"
            onClick={() => {
              router.push(`/transactionlist`);
            }}
          >
            Back
          </Button>
          {searchParams.get("reviewed") == "0" && (
            <Button
              variant="contained"
              color="primary"
              onClick={submitFeedback}
              sx={{ mt: 3, ml: 1 }}
            >
              Submit
            </Button>
          )}
        </div>
      </Box>
    </Container>
  );
}
